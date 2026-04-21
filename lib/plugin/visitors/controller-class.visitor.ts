import { HttpStatus } from '@nestjs/common';
import { compact, head } from 'lodash';
import { posix } from 'path';
import * as ts from 'typescript';
import { ApiOperation, ApiResponse } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  createLiteralFromAnyValue,
  getDecoratorArguments,
  getDecoratorName,
  getMainCommentOfNode,
  getTsDocErrorsOfNode,
  getTsDocTagsOfNode
} from '../utils/ast-utils';
import {
  convertPath,
  getDecoratorOrUndefinedByNames,
  getOutputExtension,
  getTypeReferenceAsString,
  hasPropertyKey,
  normalizePackagePath
} from '../utils/plugin-utils';
import { typeReferenceToIdentifier } from '../utils/type-reference-to-identifier.util';
import { AbstractFileVisitor } from './abstract.visitor';

type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;

const SUCCESS_API_RESPONSE_DECORATORS = new Set(
  Object.keys(HttpStatus)
    .filter((key) => {
      const code = Number(HttpStatus[key as keyof typeof HttpStatus]);
      return !isNaN(code) && code >= 200 && code < 300;
    })
    .map((key) => {
      const functionName = key
        .split('_')
        .map(
          (strToken) =>
            `${strToken[0].toUpperCase()}${strToken.slice(1).toLowerCase()}`
        )
        .join('');
      return `Api${functionName}Response`;
    })
    .concat(['ApiDefaultResponse'])
);

function isSuccessStatusArgument(decorator: ts.Decorator): boolean {
  const args = getDecoratorArguments(decorator);
  const firstArg = head(args);
  if (!firstArg || !ts.isObjectLiteralExpression(firstArg)) {
    return false;
  }
  const statusProp = firstArg.properties.find(
    (prop) =>
      ts.isPropertyAssignment(prop) &&
      ((ts.isIdentifier(prop.name) && prop.name.text === 'status') ||
        (ts.isStringLiteral(prop.name) && prop.name.text === 'status'))
  ) as ts.PropertyAssignment | undefined;
  if (!statusProp) {
    return false;
  }
  const initializer = statusProp.initializer;
  if (ts.isNumericLiteral(initializer)) {
    const code = Number(initializer.text);
    return code >= 200 && code < 300;
  }
  if (ts.isStringLiteral(initializer)) {
    const value = initializer.text;
    return value === '2XX' || value === 'default';
  }
  // Fallback for property access expressions like HttpStatus.OK or other
  // identifiers that resolve to a 2xx value at runtime. We cannot evaluate
  // the expression here, so we default to treating it as an explicit
  // response declaration (preserves the original behavior of the
  // explicit-decorator guard).
  return true;
}

export class ControllerClassVisitor extends AbstractFileVisitor {
  private readonly _collectedMetadata: Record<
    string,
    Record<string, ClassMetadata>
  > = {};
  private readonly _typeImports: Record<string, string> = {};

  get typeImports() {
    return this._typeImports;
  }

  collectedMetadata(
    options: PluginOptions
  ): Array<[ts.CallExpression, Record<string, ClassMetadata>]> {
    const metadataWithImports = [];
    Object.keys(this._collectedMetadata).forEach((filePath) => {
      const metadata = this._collectedMetadata[filePath];
      const fileExt = options.esmCompatible ? getOutputExtension(filePath) : '';
      let path = filePath.replace(/\.[jt]s$/, fileExt);
      path = normalizePackagePath(path);
      const importExpr = ts.factory.createCallExpression(
        ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as ts.Expression,
        undefined,
        [ts.factory.createStringLiteral(path)]
      );
      metadataWithImports.push([importExpr, metadata]);
    });
    return metadataWithImports;
  }

  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ) {
    const typeChecker = program.getTypeChecker();
    if (!options.readonly) {
      sourceFile = this.updateImports(sourceFile, ctx.factory, program);
    }

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isMethodDeclaration(node)) {
        try {
          const metadata: ClassMetadata = {};
          const updatedNode = this.addDecoratorToNode(
            ctx.factory,
            node,
            typeChecker,
            options,
            sourceFile,
            metadata
          );
          if (!options.readonly) {
            return updatedNode;
          } else {
            const filePath = this.normalizeImportPath(
              options.pathToSource,
              sourceFile.fileName
            );

            if (!this._collectedMetadata[filePath]) {
              this._collectedMetadata[filePath] = {};
            }

            const parent = node.parent as ts.ClassDeclaration;
            const clsName = parent.name?.getText();

            if (clsName) {
              if (!this._collectedMetadata[filePath][clsName]) {
                this._collectedMetadata[filePath][clsName] = {};
              }
              Object.assign(
                this._collectedMetadata[filePath][clsName],
                metadata
              );
            }
          }
        } catch {
          if (!options.readonly) {
            return node;
          }
        }
      }

      if (options.readonly) {
        ts.forEachChild(node, visitNode);
      } else {
        return ts.visitEachChild(node, visitNode, ctx);
      }
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(
    factory: ts.NodeFactory,
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    metadata: ClassMetadata
  ): ts.MethodDeclaration {
    const hostFilename = sourceFile.fileName;
    const decorators =
      ts.canHaveDecorators(compilerNode) && ts.getDecorators(compilerNode);

    if (!decorators) {
      return compilerNode;
    }

    const apiOperationDecoratorsArray = this.createApiOperationDecorator(
      factory,
      compilerNode,
      decorators,
      options,
      sourceFile,
      typeChecker,
      metadata
    );

    const apiResponseDecoratorsArray = this.createApiResponseDecorator(
      factory,
      compilerNode,
      options,
      metadata
    );

    const removeExistingApiOperationDecorator =
      apiOperationDecoratorsArray.length > 0;

    const existingDecorators = removeExistingApiOperationDecorator
      ? decorators.filter(
          (item) => getDecoratorName(item) !== ApiOperation.name
        )
      : decorators;

    const hasExplicitApiResponseDecorator = decorators.some((item) => {
      try {
        const decoratorName = getDecoratorName(item);
        if (!decoratorName) {
          return false;
        }
        if (decoratorName === ApiResponse.name) {
          return isSuccessStatusArgument(item);
        }
        return SUCCESS_API_RESPONSE_DECORATORS.has(decoratorName);
      } catch {
        return false;
      }
    });

    const modifiers = ts.getModifiers(compilerNode) ?? [];
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      factory,
      compilerNode,
      typeChecker,
      factory.createNodeArray(),
      hostFilename,
      metadata,
      options
    );
    const autoGeneratedApiResponseDecorators = hasExplicitApiResponseDecorator
      ? []
      : [
          factory.createDecorator(
            factory.createCallExpression(
              factory.createIdentifier(
                `${OPENAPI_NAMESPACE}.${ApiResponse.name}`
              ),
              undefined,
              [
                factory.createObjectLiteralExpression(
                  objectLiteralExpr.properties
                )
              ]
            )
          )
        ];
    const updatedDecorators = [
      ...apiOperationDecoratorsArray,
      ...apiResponseDecoratorsArray,
      ...existingDecorators,
      ...autoGeneratedApiResponseDecorators
    ];

    if (!options.readonly) {
      return factory.updateMethodDeclaration(
        compilerNode,
        [...updatedDecorators, ...modifiers],
        compilerNode.asteriskToken,
        compilerNode.name,
        compilerNode.questionToken,
        compilerNode.typeParameters,
        compilerNode.parameters,
        compilerNode.type,
        compilerNode.body
      );
    } else {
      return compilerNode;
    }
  }

  createApiOperationDecorator(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    decorators: readonly ts.Decorator[],
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    metadata: ClassMetadata
  ) {
    if (!options.introspectComments) {
      return [];
    }

    const apiOperationDecorator = getDecoratorOrUndefinedByNames(
      [ApiOperation.name],
      decorators,
      factory
    );
    let apiOperationExistingProps:
      | ts.NodeArray<ts.PropertyAssignment>
      | undefined = undefined;

    if (apiOperationDecorator && !options.readonly) {
      const apiOperationExpr = head(
        getDecoratorArguments(apiOperationDecorator)
      );
      if (apiOperationExpr) {
        apiOperationExistingProps =
          apiOperationExpr.properties as ts.NodeArray<ts.PropertyAssignment>;
      }
    }

    const extractedComments = getMainCommentOfNode(node);
    if (!extractedComments) {
      return [];
    }
    const properties = [
      ...(apiOperationExistingProps ?? factory.createNodeArray())
    ];

    const tags = getTsDocTagsOfNode(node, typeChecker);
    const hasRemarksKey = hasPropertyKey(
      'description',
      factory.createNodeArray(apiOperationExistingProps)
    );
    if (!hasRemarksKey && tags.remarks) {
      // When the @remarks tag is used in the comment, it will be added to the description property of the @ApiOperation decorator.
      // In this case, even when the "controllerKeyOfComment" option is set to "description", the "summary" property will be used.
      const remarksPropertyAssignment = factory.createPropertyAssignment(
        'description',
        createLiteralFromAnyValue(factory, tags.remarks)
      );
      properties.push(remarksPropertyAssignment);

      if (options.controllerKeyOfComment === 'description') {
        properties.unshift(
          factory.createPropertyAssignment(
            'summary',
            factory.createStringLiteral(extractedComments)
          )
        );
      } else {
        const keyToGenerate = options.controllerKeyOfComment;
        properties.unshift(
          factory.createPropertyAssignment(
            keyToGenerate,
            factory.createStringLiteral(extractedComments)
          )
        );
      }
    } else {
      // No @remarks tag was found in the comment so use the attribute set by the user
      const keyToGenerate = options.controllerKeyOfComment;
      properties.unshift(
        factory.createPropertyAssignment(
          keyToGenerate,
          factory.createStringLiteral(extractedComments)
        )
      );
    }

    const hasDeprecatedKey = hasPropertyKey(
      'deprecated',
      factory.createNodeArray(apiOperationExistingProps)
    );
    if (!hasDeprecatedKey && tags.deprecated) {
      const deprecatedPropertyAssignment = factory.createPropertyAssignment(
        'deprecated',
        createLiteralFromAnyValue(factory, tags.deprecated)
      );
      properties.push(deprecatedPropertyAssignment);
    }

    const objectLiteralExpr = factory.createObjectLiteralExpression(
      compact(properties)
    );
    const apiOperationDecoratorArguments: ts.NodeArray<ts.Expression> =
      factory.createNodeArray([objectLiteralExpr]);

    const methodKey = node.name.getText();
    if (metadata[methodKey]) {
      const existingObjectLiteralExpr = metadata[methodKey];
      const existingProperties = existingObjectLiteralExpr.properties;
      const updatedProperties = factory.createNodeArray([
        ...existingProperties,
        ...compact(properties)
      ]);
      const updatedObjectLiteralExpr =
        factory.createObjectLiteralExpression(updatedProperties);
      metadata[methodKey] = updatedObjectLiteralExpr;
    } else {
      metadata[methodKey] = objectLiteralExpr;
    }

    if (apiOperationDecorator) {
      const expr = apiOperationDecorator.expression as any as ts.CallExpression;
      const updatedCallExpr = factory.updateCallExpression(
        expr,
        expr.expression,
        undefined,
        apiOperationDecoratorArguments
      );
      return [factory.updateDecorator(apiOperationDecorator, updatedCallExpr)];
    } else {
      return [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(
              `${OPENAPI_NAMESPACE}.${ApiOperation.name}`
            ),
            undefined,
            apiOperationDecoratorArguments
          )
        )
      ];
    }
  }

  createApiResponseDecorator(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    options: PluginOptions,
    metadata: ClassMetadata
  ) {
    if (!options.introspectComments) {
      return [];
    }

    const tags = getTsDocErrorsOfNode(node);
    if (!tags.length) {
      return [];
    }

    return tags.map((tag) => {
      const properties = [];
      properties.push(
        factory.createPropertyAssignment(
          'status',
          factory.createNumericLiteral(tag.status)
        )
      );
      properties.push(
        factory.createPropertyAssignment(
          'description',
          factory.createNumericLiteral(tag.description)
        )
      );
      const objectLiteralExpr = factory.createObjectLiteralExpression(
        compact(properties)
      );
      const methodKey = node.name.getText();
      metadata[methodKey] = objectLiteralExpr;

      const apiResponseDecoratorArguments: ts.NodeArray<ts.Expression> =
        factory.createNodeArray([objectLiteralExpr]);
      return factory.createDecorator(
        factory.createCallExpression(
          factory.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
          undefined,
          apiResponseDecoratorArguments
        )
      );
    });
  }

  createDecoratorObjectLiteralExpr(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = factory.createNodeArray(),
    hostFilename: string,
    metadata: ClassMetadata,
    options: PluginOptions
  ): ts.ObjectLiteralExpression {
    let properties = [];

    if (!options.readonly && !options.skipAutoHttpCode) {
      properties = properties.concat(
        existingProperties,
        this.createStatusPropertyAssignment(factory, node, existingProperties)
      );
    }

    properties = properties.concat([
      this.createTypePropertyAssignment(
        factory,
        node,
        typeChecker,
        existingProperties,
        hostFilename,
        options
      )
    ]);
    const objectLiteralExpr = factory.createObjectLiteralExpression(
      compact(properties)
    );

    const methodKey = node.name.getText();
    const existingExprOrUndefined = metadata[methodKey];
    if (existingExprOrUndefined) {
      const existingProperties = existingExprOrUndefined.properties;
      const updatedProperties = factory.createNodeArray([
        ...existingProperties,
        ...compact(properties)
      ]);
      const updatedObjectLiteralExpr =
        factory.createObjectLiteralExpression(updatedProperties);
      metadata[methodKey] = updatedObjectLiteralExpr;
    } else {
      metadata[methodKey] = objectLiteralExpr;
    }
    return objectLiteralExpr;
  }

  createTypePropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string,
    options: PluginOptions
  ) {
    if (hasPropertyKey('type', existingProperties)) {
      return undefined;
    }
    const signature = typeChecker.getSignatureFromDeclaration(node);
    const type = typeChecker.getReturnTypeOfSignature(signature);
    if (!type) {
      return undefined;
    }
    const typeReferenceDescriptor = getTypeReferenceAsString(type, typeChecker);
    if (!typeReferenceDescriptor.typeName) {
      return undefined;
    }
    if (typeReferenceDescriptor.typeName.includes('node_modules')) {
      return undefined;
    }
    const identifier = typeReferenceToIdentifier(
      typeReferenceDescriptor,
      hostFilename,
      options,
      factory,
      type,
      this._typeImports
    );
    return factory.createPropertyAssignment('type', identifier);
  }

  createStatusPropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>
  ) {
    if (hasPropertyKey('status', existingProperties)) {
      return undefined;
    }
    const statusNode = this.getStatusCodeIdentifier(factory, node);
    return factory.createPropertyAssignment('status', statusNode);
  }

  getStatusCodeIdentifier(factory: ts.NodeFactory, node: ts.MethodDeclaration) {
    const decorators = ts.canHaveDecorators(node) && ts.getDecorators(node);
    const httpCodeDecorator = getDecoratorOrUndefinedByNames(
      ['HttpCode'],
      decorators,
      factory
    );
    if (httpCodeDecorator) {
      const argument = head(getDecoratorArguments(httpCodeDecorator));
      if (argument) {
        return argument;
      }
    }
    const postDecorator = getDecoratorOrUndefinedByNames(
      ['Post'],
      decorators,
      factory
    );
    if (postDecorator) {
      return factory.createIdentifier('201');
    }
    return factory.createIdentifier('200');
  }

  private normalizeImportPath(pathToSource: string, path: string) {
    let relativePath = posix.relative(
      convertPath(pathToSource),
      convertPath(path)
    );
    relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;
    return relativePath;
  }
}

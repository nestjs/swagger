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
  getTypeReferenceAsString,
  hasPropertyKey
} from '../utils/plugin-utils';
import { typeReferenceToIdentifier } from '../utils/type-reference-to-identifier.util';
import { AbstractFileVisitor } from './abstract.visitor';

type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;

export class ControllerClassVisitor extends AbstractFileVisitor {
  private readonly _collectedMetadata: Record<
    string,
    Record<string, ClassMetadata>
  > = {};
  private readonly _typeImports: Record<string, string> = {};

  get typeImports() {
    return this._typeImports;
  }

  get collectedMetadata(): Array<
    [ts.CallExpression, Record<string, ClassMetadata>]
  > {
    const metadataWithImports = [];
    Object.keys(this._collectedMetadata).forEach((filePath) => {
      const metadata = this._collectedMetadata[filePath];
      const path = filePath.replace(/\.[jt]s$/, '');
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
      decorators,
      options,
      sourceFile,
      typeChecker,
      metadata
    );

    const removeExistingApiOperationDecorator =
      apiOperationDecoratorsArray.length > 0;

    const existingDecorators = removeExistingApiOperationDecorator
      ? decorators.filter(
          (item) => getDecoratorName(item) !== ApiOperation.name
        )
      : decorators;

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
    const updatedDecorators = [
      ...apiOperationDecoratorsArray,
      ...apiResponseDecoratorsArray,
      ...existingDecorators,
      factory.createDecorator(
        factory.createCallExpression(
          factory.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
          undefined,
          [factory.createObjectLiteralExpression(objectLiteralExpr.properties)]
        )
      )
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
    const keyToGenerate = options.controllerKeyOfComment;
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

    const extractedComments = getMainCommentOfNode(node, sourceFile);
    if (!extractedComments) {
      return [];
    }
    const tags = getTsDocTagsOfNode(node, typeChecker);

    const properties = [
      factory.createPropertyAssignment(
        keyToGenerate,
        factory.createStringLiteral(extractedComments)
      ),
      ...(apiOperationExistingProps ?? factory.createNodeArray())
    ];

    const hasRemarksKey = hasPropertyKey(
      'description',
      factory.createNodeArray(apiOperationExistingProps)
    );
    if (!hasRemarksKey && tags.remarks) {
      const remarksPropertyAssignment = factory.createPropertyAssignment(
        'description',
        createLiteralFromAnyValue(factory, tags.remarks)
      );
      properties.push(remarksPropertyAssignment);
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
    decorators: readonly ts.Decorator[],
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    metadata: ClassMetadata
  ) {
    if (!options.introspectComments) {
      return [];
    }
    const apiResponseDecorator = getDecoratorOrUndefinedByNames(
      [ApiResponse.name],
      decorators,
      factory
    );
    let apiResponseExistingProps:
      | ts.NodeArray<ts.PropertyAssignment>
      | undefined = undefined;

    if (apiResponseDecorator && !options.readonly) {
      const apiResponseExpr = head(getDecoratorArguments(apiResponseDecorator));
      if (apiResponseExpr) {
        apiResponseExistingProps =
          apiResponseExpr.properties as ts.NodeArray<ts.PropertyAssignment>;
      }
    }

    const tags = getTsDocErrorsOfNode(node);
    if (!tags.length) {
      return [];
    }

    return tags.map((tag) => {
      const properties = [
        ...(apiResponseExistingProps ?? factory.createNodeArray())
      ];
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
    if (!options.readonly) {
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

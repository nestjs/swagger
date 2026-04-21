import { HttpStatus } from '@nestjs/common';
import { compact, head } from 'lodash';
import { posix } from 'path';
import * as ts from 'typescript';
import { ApiOperation, ApiQuery, ApiResponse } from '../../decorators';
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

function isSuccessOrRedirectApiResponseArg(decorator: ts.Decorator): boolean {
  const [firstArg] = getDecoratorArguments(decorator);
  if (!firstArg || !ts.isObjectLiteralExpression(firstArg)) return true;
  const statusProp = firstArg.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'status'
  );
  if (!statusProp) return true;
  const init = statusProp.initializer;
  if (ts.isNumericLiteral(init)) return Number(init.text) < 400;
  if (ts.isStringLiteral(init)) {
    return (
      init.text === '1XX' ||
      init.text === '2XX' ||
      init.text === '3XX' ||
      init.text === 'default'
    );
  }
  // Non-literal (e.g. HttpStatus.OK) — can't evaluate at compile time; preserve pre-PR behavior.
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

    const apiQueryDecoratorsArray = this.createApiQueryDecorators(
      factory,
      compilerNode,
      decorators
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
        // Error factories (4xx/5xx) must not suppress the auto-inferred 2xx.
        if (decoratorName === ApiResponse.name) {
          return isSuccessOrRedirectApiResponseArg(item);
        }
        const statusNameMatch = decoratorName.match(/^Api(.+)Response$/);
        if (!statusNameMatch) return false;
        const statusKey = statusNameMatch[1]
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toUpperCase();
        const status = Number(HttpStatus[statusKey as keyof typeof HttpStatus]);
        return isNaN(status) || status < 400;
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
      ...apiQueryDecoratorsArray,
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
    const existingPropsArray = factory.createNodeArray(apiOperationExistingProps);
    const hasRemarksKey = hasPropertyKey('description', existingPropsArray);
    // Helper so we never unshift a key the user has already written in the
    // explicit @ApiOperation({...}) call; otherwise the generated object
    // literal would contain duplicate keys (e.g. `{ summary: 'doc', summary: 'user' }`).
    const unshiftIfNotExisting = (key: string, value: string) => {
      if (hasPropertyKey(key, existingPropsArray)) {
        return;
      }
      properties.unshift(
        factory.createPropertyAssignment(
          key,
          factory.createStringLiteral(value)
        )
      );
    };
    if (!hasRemarksKey && tags.remarks) {
      // When the @remarks tag is used in the comment, it will be added to the description property of the @ApiOperation decorator.
      // In this case, even when the "controllerKeyOfComment" option is set to "description", the "summary" property will be used.
      const remarksPropertyAssignment = factory.createPropertyAssignment(
        'description',
        createLiteralFromAnyValue(factory, tags.remarks)
      );
      properties.push(remarksPropertyAssignment);

      if (options.controllerKeyOfComment === 'description') {
        unshiftIfNotExisting('summary', extractedComments);
      } else {
        unshiftIfNotExisting(options.controllerKeyOfComment, extractedComments);
      }
    } else {
      // No @remarks tag was found in the comment so use the attribute set by the user
      unshiftIfNotExisting(options.controllerKeyOfComment, extractedComments);
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
          factory.createStringLiteral(tag.description)
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

  /**
   * Inspects the method's parameters and, for each `@Query('name')` parameter
   * whose TypeScript declaration is optional (via `?`, a default value, or a
   * union type that includes `undefined`), emits an
   * `@ApiQuery({ name, required: false })` decorator so the generated OpenAPI
   * spec marks the query as optional.
   *
   * An existing `@ApiQuery` decorator on the method for the same name takes
   * precedence and is left untouched. If the method already uses
   * `@ApiQuery(...)` in a shape we cannot reliably introspect (no literal
   * `name` property, or a non-object-literal argument), we skip generation
   * entirely for that method to avoid emitting duplicate metadata.
   *
   * Related to issue nestjs/swagger#30.
   */
  createApiQueryDecorators(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    methodDecorators: readonly ts.Decorator[]
  ): ts.Decorator[] {
    const parameters = node.parameters;
    if (!parameters || parameters.length === 0) {
      return [];
    }

    const existingApiQueryNames = new Set<string>();
    for (const decorator of methodDecorators) {
      let decoratorName: string | undefined;
      try {
        decoratorName = getDecoratorName(decorator);
      } catch {
        continue;
      }
      if (decoratorName !== ApiQuery.name) {
        continue;
      }
      const optionsExpr = head(getDecoratorArguments(decorator));
      if (!optionsExpr || !ts.isObjectLiteralExpression(optionsExpr)) {
        return [];
      }
      const nameProp = optionsExpr.properties.find(
        (p) =>
          ts.isPropertyAssignment(p) &&
          p.name !== undefined &&
          ((ts.isIdentifier(p.name) && p.name.text === 'name') ||
            (ts.isStringLiteral(p.name) && p.name.text === 'name'))
      ) as ts.PropertyAssignment | undefined;
      if (nameProp && ts.isStringLiteral(nameProp.initializer)) {
        existingApiQueryNames.add(nameProp.initializer.text);
      } else {
        return [];
      }
    }

    const generated: ts.Decorator[] = [];
    for (const parameter of parameters) {
      const paramDecorators =
        (ts.canHaveDecorators(parameter) && ts.getDecorators(parameter)) || [];

      const queryDecorator = paramDecorators.find((d) => {
        try {
          return getDecoratorName(d) === 'Query';
        } catch {
          return false;
        }
      });
      if (!queryDecorator) {
        continue;
      }

      const firstArg = head(getDecoratorArguments(queryDecorator));
      if (!firstArg || !ts.isStringLiteral(firstArg)) {
        // `@Query()` without a literal name refers to the whole query object
        // and does not map to a single OpenAPI parameter; skip it.
        continue;
      }
      const queryName = firstArg.text;

      if (existingApiQueryNames.has(queryName)) {
        continue;
      }

      if (!this.isParameterOptional(parameter)) {
        continue;
      }

      const objectLiteral = factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            'name',
            factory.createStringLiteral(queryName)
          ),
          factory.createPropertyAssignment('required', factory.createFalse())
        ],
        false
      );

      generated.push(
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiQuery.name}`),
            undefined,
            [objectLiteral]
          )
        )
      );

      // Guard against duplicates when the same literal name is used by
      // more than one optional `@Query('foo')` parameter in the method.
      existingApiQueryNames.add(queryName);
    }

    return generated;
  }

  /**
   * Returns true when the parameter should be considered optional from the
   * perspective of the OpenAPI spec:
   *   - declared with a `?` token: `@Query('foo') foo?: string`
   *   - given a default value:     `@Query('foo') foo: string = 'bar'`
   *   - typed with a union that includes `undefined`:
   *                                `@Query('foo') foo: string | undefined`
   *
   * Detection is based on the parameter's AST only so the logic does not
   * depend on a fully resolved TypeChecker; this keeps the transform usable
   * in contexts (e.g. isolated `transpileModule`) where cross-file type
   * information is not available.
   */
  private isParameterOptional(parameter: ts.ParameterDeclaration): boolean {
    if (parameter.questionToken) {
      return true;
    }
    if (parameter.initializer) {
      return true;
    }
    if (parameter.type && ts.isUnionTypeNode(parameter.type)) {
      return parameter.type.types.some(
        (t) => t.kind === ts.SyntaxKind.UndefinedKeyword
      );
    }
    return false;
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

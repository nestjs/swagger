import { compact, head } from 'lodash';
import * as ts from 'typescript';
import { ApiOperation, ApiResponse } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  createLiteralFromAnyValue,
  getDecoratorArguments,
  getDecoratorName,
  getMainCommentOfNode,
  getTsDocTagsOfNode
} from '../utils/ast-utils';
import {
  getDecoratorOrUndefinedByNames,
  getTypeReferenceAsString,
  hasPropertyKey,
  replaceImportPath
} from '../utils/plugin-utils';
import { AbstractFileVisitor } from './abstract.visitor';

export class ControllerClassVisitor extends AbstractFileVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ) {
    const typeChecker = program.getTypeChecker();
    sourceFile = this.updateImports(sourceFile, ctx.factory);

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isMethodDeclaration(node)) {
        try {
          return this.addDecoratorToNode(
            ctx.factory,
            node,
            typeChecker,
            options,
            sourceFile.fileName,
            sourceFile
          );
        } catch {
          return node;
        }
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(
    factory: ts.NodeFactory,
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string,
    sourceFile: ts.SourceFile
  ): ts.MethodDeclaration {
    if (!compilerNode.decorators) {
      return compilerNode;
    }

    const apiOperationDecoratorsArray = this.createApiOperationDecorator(
      factory,
      compilerNode,
      compilerNode.decorators,
      options,
      sourceFile,
      typeChecker
    );
    const removeExistingApiOperationDecorator =
      apiOperationDecoratorsArray.length > 0;

    const existingDecorators = removeExistingApiOperationDecorator
      ? compilerNode.decorators.filter(
          (item) => getDecoratorName(item) !== ApiOperation.name
        )
      : compilerNode.decorators;

    return factory.updateMethodDeclaration(
      compilerNode,
      [
        ...apiOperationDecoratorsArray,
        ...existingDecorators,
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(
              `${OPENAPI_NAMESPACE}.${ApiResponse.name}`
            ),
            undefined,
            [
              this.createDecoratorObjectLiteralExpr(
                factory,
                compilerNode,
                typeChecker,
                factory.createNodeArray(),
                hostFilename
              )
            ]
          )
        )
      ],
      compilerNode.modifiers,
      compilerNode.asteriskToken,
      compilerNode.name,
      compilerNode.questionToken,
      compilerNode.typeParameters,
      compilerNode.parameters,
      compilerNode.type,
      compilerNode.body
    );
  }

  createApiOperationDecorator(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    nodeArray: ts.NodeArray<ts.Decorator>,
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ) {
    if (!options.introspectComments) {
      return [];
    }
    const keyToGenerate = options.controllerKeyOfComment;
    const apiOperationDecorator = getDecoratorOrUndefinedByNames(
      [ApiOperation.name],
      nodeArray
    );
    const apiOperationExpr: ts.ObjectLiteralExpression | undefined =
      apiOperationDecorator &&
      head(getDecoratorArguments(apiOperationDecorator));
    const apiOperationExprProperties =
      apiOperationExpr &&
      (apiOperationExpr.properties as ts.NodeArray<ts.PropertyAssignment>);

    const extractedComments = getMainCommentOfNode(node, sourceFile);
    const tags = getTsDocTagsOfNode(node, sourceFile, typeChecker);

    const properties = [
      factory.createPropertyAssignment(
        keyToGenerate,
        factory.createStringLiteral(extractedComments)
      ),
      ...(apiOperationExprProperties ?? factory.createNodeArray())
    ];

    const hasDeprecatedKey = hasPropertyKey('deprecated', factory.createNodeArray(apiOperationExprProperties));
    if (!hasDeprecatedKey && tags.deprecated) {
      const deprecatedPropertyAssignment = factory.createPropertyAssignment(
        'deprecated',
        createLiteralFromAnyValue(factory, tags.deprecated)
      );
      properties.push(deprecatedPropertyAssignment);
    }

    const apiOperationDecoratorArguments: ts.NodeArray<ts.Expression> =
      factory.createNodeArray([
        factory.createObjectLiteralExpression(compact(properties))
      ]);
    if (apiOperationDecorator) {
      const expr =
        apiOperationDecorator.expression as any as ts.CallExpression;
      const updatedCallExpr = factory.updateCallExpression(
        expr,
        expr.expression,
        undefined,
        apiOperationDecoratorArguments
      );
      return [
        factory.updateDecorator(apiOperationDecorator, updatedCallExpr)
      ];
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

  createDecoratorObjectLiteralExpr(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = factory.createNodeArray(),
    hostFilename: string
  ): ts.ObjectLiteralExpression {
    const properties = [
      ...existingProperties,
      this.createStatusPropertyAssignment(factory, node, existingProperties),
      this.createTypePropertyAssignment(
        factory,
        node,
        typeChecker,
        existingProperties,
        hostFilename
      )
    ];
    return factory.createObjectLiteralExpression(compact(properties));
  }

  createTypePropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string
  ) {
    if (hasPropertyKey('type', existingProperties)) {
      return undefined;
    }
    const signature = typeChecker.getSignatureFromDeclaration(node);
    const type = typeChecker.getReturnTypeOfSignature(signature);
    if (!type) {
      return undefined;
    }
    let typeReference = getTypeReferenceAsString(type, typeChecker);
    if (!typeReference) {
      return undefined;
    }
    if (typeReference.includes('node_modules')) {
      return undefined;
    }
    typeReference = replaceImportPath(typeReference, hostFilename);
    return factory.createPropertyAssignment(
      'type',
      factory.createIdentifier(typeReference)
    );
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
    const decorators = node.decorators;
    const httpCodeDecorator = getDecoratorOrUndefinedByNames(
      ['HttpCode'],
      decorators
    );
    if (httpCodeDecorator) {
      const argument = head(getDecoratorArguments(httpCodeDecorator));
      if (argument) {
        return argument;
      }
    }
    const postDecorator = getDecoratorOrUndefinedByNames(['Post'], decorators);
    if (postDecorator) {
      return factory.createIdentifier('201');
    }
    return factory.createIdentifier('200');
  }
}

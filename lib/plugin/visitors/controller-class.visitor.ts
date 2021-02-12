import { compact, head } from 'lodash';
import * as ts from 'typescript';
import { ApiOperation, ApiResponse } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  getDecoratorArguments,
  getMainCommentAndExamplesOfNode
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
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string,
    sourceFile: ts.SourceFile
  ): ts.MethodDeclaration {
    const node = ts.getMutableClone(compilerNode);
    if (!node.decorators) {
      return node;
    }
    const nodeArray = node.decorators;
    const { pos, end } = nodeArray;

    (node as any).decorators = Object.assign(
      [
        ...this.createApiOperationDecorator(
          node,
          nodeArray,
          options,
          sourceFile,
          typeChecker
        ),
        ...nodeArray,
        ts.createDecorator(
          ts.createCall(
            ts.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
            undefined,
            [
              this.createDecoratorObjectLiteralExpr(
                node,
                typeChecker,
                ts.createNodeArray(),
                hostFilename
              )
            ]
          )
        )
      ],
      { pos, end }
    );
    return node;
  }

  createApiOperationDecorator(
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

    if (
      !apiOperationDecorator ||
      !apiOperationExpr ||
      !apiOperationExprProperties ||
      !hasPropertyKey(keyToGenerate, apiOperationExprProperties)
    ) {
      const [extractedComments] = getMainCommentAndExamplesOfNode(
        node,
        sourceFile,
        typeChecker
      );
      if (!extractedComments) {
        // Node does not have any comments
        return [];
      }
      const properties = [
        ts.createPropertyAssignment(
          keyToGenerate,
          ts.createLiteral(extractedComments)
        ),
        ...(apiOperationExprProperties ?? ts.createNodeArray())
      ];
      const apiOperationDecoratorArguments: ts.NodeArray<ts.Expression> = ts.createNodeArray(
        [ts.createObjectLiteral(compact(properties))]
      );
      if (apiOperationDecorator) {
        ((apiOperationDecorator.expression as ts.CallExpression) as any).arguments = apiOperationDecoratorArguments;
      } else {
        return [
          ts.createDecorator(
            ts.createCall(
              ts.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiOperation.name}`),
              undefined,
              apiOperationDecoratorArguments
            )
          )
        ];
      }
    }
    return [];
  }

  createDecoratorObjectLiteralExpr(
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = ts.createNodeArray(),
    hostFilename: string
  ): ts.ObjectLiteralExpression {
    const properties = [
      ...existingProperties,
      this.createStatusPropertyAssignment(node, existingProperties),
      this.createTypePropertyAssignment(
        node,
        typeChecker,
        existingProperties,
        hostFilename
      )
    ];
    return ts.createObjectLiteral(compact(properties));
  }

  createTypePropertyAssignment(
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
    return ts.createPropertyAssignment(
      'type',
      ts.createIdentifier(typeReference)
    );
  }

  createStatusPropertyAssignment(
    node: ts.MethodDeclaration,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>
  ) {
    if (hasPropertyKey('status', existingProperties)) {
      return undefined;
    }
    const statusNode = this.getStatusCodeIdentifier(node);
    return ts.createPropertyAssignment('status', statusNode);
  }

  getStatusCodeIdentifier(node: ts.MethodDeclaration) {
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
      return ts.createIdentifier('201');
    }
    return ts.createIdentifier('200');
  }
}

import { compact, head } from 'lodash';
import * as ts from 'typescript';
import { ApiResponse, ApiOperation } from '../../decorators';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  getDecoratorArguments,
  getMainCommentAnExamplesOfNode
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
    program: ts.Program
  ) {
    const typeChecker = program.getTypeChecker();
    sourceFile = this.updateImports(sourceFile);

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isMethodDeclaration(node)) {
        return this.addDecoratorToNode(
          node,
          typeChecker,
          sourceFile.fileName,
          sourceFile
        );
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    sourceFile: ts.SourceFile
  ): ts.MethodDeclaration {
    const node = ts.getMutableClone(compilerNode);
    const nodeArray = node.decorators || ts.createNodeArray();
    const { pos, end } = nodeArray;

    node.decorators = Object.assign(
      [
        ...this.createApiOperationOrEmptyInArray(node, nodeArray, sourceFile),
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

  createApiOperationOrEmptyInArray(
    node: ts.MethodDeclaration,
    nodeArray: ts.NodeArray<ts.Decorator>,
    sourceFile: ts.SourceFile
  ) {
    const descriptionKey = 'description';
    const apiOperationDecorator = getDecoratorOrUndefinedByNames(
      [ApiOperation.name],
      nodeArray
    );
    let apiOperationOptions: ts.ObjectLiteralExpression;
    let apiOperationOptionsProperties: ts.NodeArray<ts.PropertyAssignment>;
    let comments;
    if (
      // No ApiOperation or No ApiOperationOptions or ApiOperationOptions is empty or No description in ApiOperationOptions
      (!apiOperationDecorator ||
        !(apiOperationOptions = head(
          getDecoratorArguments(apiOperationDecorator)
        )) ||
        !(apiOperationOptionsProperties = apiOperationOptions.properties as ts.NodeArray<
          ts.PropertyAssignment
        >) ||
        !hasPropertyKey(descriptionKey, apiOperationOptionsProperties)) &&
      // Has comments
      ([comments] = getMainCommentAnExamplesOfNode(node, sourceFile))[0]
    ) {
      const properties = [
        ts.createPropertyAssignment(descriptionKey, ts.createLiteral(comments)),
        ...(apiOperationOptionsProperties ?? ts.createNodeArray())
      ];
      const apiOperationDecoratorArguments: ts.NodeArray<ts.Expression> = ts.createNodeArray(
        [ts.createObjectLiteral(compact(properties))]
      );
      if (apiOperationDecorator) {
        (apiOperationDecorator.expression as ts.CallExpression).arguments = apiOperationDecoratorArguments;
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
    existingProperties: ts.NodeArray<
      ts.PropertyAssignment
    > = ts.createNodeArray(),
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

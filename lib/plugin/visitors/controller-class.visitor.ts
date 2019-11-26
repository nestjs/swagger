import { compact, head } from 'lodash';
import * as ts from 'typescript';
import { ApiResponse } from '../../decorators';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import { getDecoratorArguments } from '../utils/ast-utils';
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
        return this.addDecoratorToNode(node, typeChecker, sourceFile.fileName);
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename: string
  ): ts.MethodDeclaration {
    const { pos, end } = compilerNode.decorators || ts.createNodeArray();

    compilerNode.decorators = Object.assign(
      [
        ...(compilerNode.decorators || ts.createNodeArray()),
        ts.createDecorator(
          ts.createCall(
            ts.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
            undefined,
            [
              this.createDecoratorObjectLiteralExpr(
                compilerNode,
                typeChecker,
                [],
                hostFilename
              )
            ]
          )
        )
      ],
      { pos, end }
    );
    return compilerNode;
  }

  createDecoratorObjectLiteralExpr(
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.PropertyAssignment[] = [],
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
    existingProperties: ts.PropertyAssignment[],
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
    typeReference = replaceImportPath(typeReference, hostFilename);
    return ts.createPropertyAssignment(
      'type',
      ts.createIdentifier(typeReference)
    );
  }

  createStatusPropertyAssignment(
    node: ts.MethodDeclaration,
    existingProperties: ts.PropertyAssignment[]
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
      return argument;
    }
    const postDecorator = getDecoratorOrUndefinedByNames(['Post'], decorators);
    if (postDecorator) {
      return ts.createIdentifier('201');
    }
    return ts.createIdentifier('200');
  }
}

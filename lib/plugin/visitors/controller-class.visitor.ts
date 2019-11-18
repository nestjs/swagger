import { compact, head } from 'lodash';
import {
  createWrappedNode,
  MethodDeclaration,
  PropertyAccessExpression
} from 'ts-morph';
import * as ts from 'typescript';
import { ApiResponse } from '../../decorators';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  getDecoratorOrUndefinedByNames,
  getTypeReferenceAsString,
  hasPropertyKey
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
        const wrappedNode = createWrappedNode(node, {
          typeChecker
        });
        return this.addDecoratorToNode(wrappedNode);
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(node: MethodDeclaration): ts.MethodDeclaration {
    const compilerNode = ts.getMutableClone(node.compilerNode);
    const { pos, end } = compilerNode.decorators || ts.createNodeArray();

    compilerNode.decorators = Object.assign(
      [
        ...(compilerNode.decorators || ts.createNodeArray()),
        ts.createDecorator(
          ts.createCall(
            ts.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
            undefined,
            [this.createDecoratorObjectLiteralExpr(node)]
          )
        )
      ],
      { pos, end }
    );
    return compilerNode;
  }

  createDecoratorObjectLiteralExpr(
    node: MethodDeclaration,
    existingProperties: ts.PropertyAssignment[] = []
  ): ts.ObjectLiteralExpression {
    const properties = [
      ...existingProperties,
      this.createStatusPropertyAssignment(node, existingProperties),
      this.createTypePropertyAssignment(node, existingProperties)
    ];
    return ts.createObjectLiteral(compact(properties));
  }

  createTypePropertyAssignment(
    node: MethodDeclaration,
    existingProperties: ts.PropertyAssignment[]
  ) {
    if (hasPropertyKey('type', existingProperties)) {
      return undefined;
    }
    const type = node.getReturnType();
    if (!type) {
      return undefined;
    }
    const typeReference = getTypeReferenceAsString(type, node);
    if (!typeReference) {
      return undefined;
    }
    return ts.createPropertyAssignment(
      'type',
      ts.createIdentifier(typeReference)
    );
  }

  createStatusPropertyAssignment(
    node: MethodDeclaration,
    existingProperties: ts.PropertyAssignment[]
  ) {
    if (hasPropertyKey('status', existingProperties)) {
      return undefined;
    }
    const statusNode = this.getStatusCodeIdentifier(node);
    return ts.createPropertyAssignment('status', statusNode);
  }

  getStatusCodeIdentifier(node: MethodDeclaration) {
    const decorators = node.getDecorators();
    const httpCodeDecorator = getDecoratorOrUndefinedByNames(
      ['HttpCode'],
      decorators
    );
    if (httpCodeDecorator) {
      const argument = head(
        httpCodeDecorator.getArguments()
      ) as PropertyAccessExpression;
      return argument && argument.compilerNode;
    }
    const postDecorator = getDecoratorOrUndefinedByNames(['Post'], decorators);
    if (postDecorator) {
      return ts.createIdentifier('201');
    }
    return ts.createIdentifier('200');
  }
}

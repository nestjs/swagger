import { compact, flatten, head } from 'lodash';
import * as ts from 'typescript';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional
} from '../../decorators';
import { PluginOptions } from '../merge-options';
import { OPENAPI_NAMESPACE } from '../plugin-constants';
import {
  getDecoratorArguments,
  getText,
  getTypeArguments,
  isArray,
  isEnum
} from '../utils/ast-utils';
import {
  getDecoratorOrUndefinedByNames,
  getTypeReferenceAsString,
  hasPropertyKey,
  replaceImportPath
} from '../utils/plugin-utils';
import { AbstractFileVisitor } from './abstract.visitor';

export class ModelClassVisitor extends AbstractFileVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ) {
    const typeChecker = program.getTypeChecker();
    sourceFile = this.updateImports(sourceFile);

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isPropertyDeclaration(node)) {
        const decorators = node.decorators;
        const hidePropertyDecorator = getDecoratorOrUndefinedByNames(
          [ApiHideProperty.name],
          decorators
        );
        if (hidePropertyDecorator) {
          return node;
        }
        const propertyDecorator = getDecoratorOrUndefinedByNames(
          [ApiProperty.name, ApiPropertyOptional.name],
          decorators
        );

        if (!propertyDecorator) {
          return this.addDecoratorToNode(
            node,
            typeChecker,
            options,
            sourceFile.fileName
          );
        }
        return this.addPropertiesToExisitingDecorator(
          propertyDecorator,
          node,
          typeChecker,
          options,
          sourceFile.fileName
        );
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addDecoratorToNode(
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string
  ): ts.PropertyDeclaration {
    const node = ts.getMutableClone(compilerNode);
    const nodeArray = node.decorators || ts.createNodeArray();
    const { pos, end } = nodeArray;

    node.decorators = Object.assign(
      [
        ...nodeArray,
        ts.createDecorator(
          ts.createCall(
            ts.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiProperty.name}`),
            undefined,
            [
              this.createDecoratorObjectLiteralExpr(
                node,
                typeChecker,
                [],
                options,
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

  addPropertiesToExisitingDecorator(
    compilerNode: ts.Decorator,
    originalNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string
  ): ts.Node {
    if (!compilerNode.expression) {
      return originalNode;
    }
    if (!(compilerNode.expression as ts.CallExpression).arguments) {
      return originalNode;
    }
    const propertyNode = ts.getMutableClone(compilerNode);
    const callExpr = ts.getMutableClone(
      propertyNode.expression
    ) as ts.CallExpression;
    const callArgs = callExpr.arguments;
    const node = ts.getMutableClone(originalNode);

    const { pos, end } = callArgs;
    const decoratorArgument = head(callArgs) as ts.ObjectLiteralExpression;
    if (!decoratorArgument) {
      callExpr.arguments = Object.assign(
        [
          this.createDecoratorObjectLiteralExpr(
            node,
            typeChecker,
            [],
            options,
            hostFilename
          )
        ],
        { pos, end }
      );
    }

    const decoratorProperties =
      (decoratorArgument && decoratorArgument.properties) || [];

    callExpr.arguments = Object.assign(
      [
        this.createDecoratorObjectLiteralExpr(
          node,
          typeChecker,
          decoratorProperties as ts.PropertyAssignment[],
          options,
          hostFilename
        )
      ],
      {
        pos,
        end
      }
    );
    return node;
  }

  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.PropertyAssignment[] = [],
    options: PluginOptions = {},
    hostFilename: string = ''
  ): ts.ObjectLiteralExpression {
    const isRequired = !node.questionToken;

    let properties = [
      ...existingProperties,
      !hasPropertyKey('required', existingProperties) &&
        ts.createPropertyAssignment('required', ts.createLiteral(isRequired)),
      this.createTypePropertyAssignment(
        node,
        typeChecker,
        existingProperties,
        hostFilename
      ),
      this.createDefaultPropertyAssignment(node, existingProperties),
      this.createEnumPropertyAssignment(
        node,
        typeChecker,
        existingProperties,
        hostFilename
      )
    ];
    if (options.classValidatorShim) {
      properties = properties.concat(
        this.createValidationPropertyAssignments(node)
      );
    }
    return ts.createObjectLiteral(compact(flatten(properties)));
  }

  createTypePropertyAssignment(
    node: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.PropertyAssignment[],
    hostFilename: string
  ) {
    const key = 'type';
    if (hasPropertyKey(key, existingProperties)) {
      return undefined;
    }
    const type = typeChecker.getTypeAtLocation(node);
    if (!type) {
      return undefined;
    }
    let typeReference = getTypeReferenceAsString(type, typeChecker);
    if (!typeReference) {
      return undefined;
    }
    typeReference = replaceImportPath(typeReference, hostFilename);
    return ts.createPropertyAssignment(
      key,
      ts.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        ts.createIdentifier(typeReference)
      )
    );
  }

  createEnumPropertyAssignment(
    node: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.PropertyAssignment[],
    hostFilename: string
  ) {
    const key = 'enum';
    if (hasPropertyKey(key, existingProperties)) {
      return undefined;
    }
    let type = typeChecker.getTypeAtLocation(node);
    if (!type) {
      return undefined;
    }
    let isArrayType = false;
    if (isArray(type)) {
      type = getTypeArguments(type)[0];
      isArrayType = true;
      if (!type) {
        return undefined;
      }
    }
    if (!isEnum(type)) {
      return undefined;
    }
    const enumRef = replaceImportPath(getText(type, typeChecker), hostFilename);
    const enumProperty = ts.createPropertyAssignment(
      key,
      ts.createIdentifier(enumRef)
    );
    if (isArrayType) {
      const isArrayKey = 'isArray';
      const isArrayProperty = ts.createPropertyAssignment(
        isArrayKey,
        ts.createIdentifier('true')
      );
      return [enumProperty, isArrayProperty];
    }
    return enumProperty;
  }

  createDefaultPropertyAssignment(
    node: ts.PropertyDeclaration,
    existingProperties: ts.PropertyAssignment[]
  ) {
    const key = 'default';
    if (hasPropertyKey(key, existingProperties)) {
      return undefined;
    }
    const initializer = node.initializer;
    if (!initializer) {
      return undefined;
    }
    return ts.createPropertyAssignment(
      key,
      ts.createIdentifier(initializer.getText())
    );
  }

  createValidationPropertyAssignments(
    node: ts.PropertyDeclaration
  ): ts.PropertyAssignment[] {
    const assignments = [];
    const decorators = node.decorators;

    this.addPropertyByValidationDecorator(
      'Min',
      'minimum',
      decorators,
      assignments
    );
    this.addPropertyByValidationDecorator(
      'Max',
      'maximum',
      decorators,
      assignments
    );
    this.addPropertyByValidationDecorator(
      'MinLength',
      'minLength',
      decorators,
      assignments
    );
    this.addPropertyByValidationDecorator(
      'MaxLength',
      'maxLength',
      decorators,
      assignments
    );

    return assignments;
  }

  addPropertyByValidationDecorator(
    decoratorName: string,
    propertyKey: string,
    decorators: ts.NodeArray<ts.Decorator>,
    assignments: ts.PropertyAssignment[]
  ) {
    const decoratorRef = getDecoratorOrUndefinedByNames(
      [decoratorName],
      decorators
    );
    if (!decoratorRef) {
      return;
    }
    const argument: ts.Expression = head(getDecoratorArguments(decoratorRef));
    assignments.push(
      ts.createPropertyAssignment(
        propertyKey,
        ts.createIdentifier(argument && argument.getText())
      )
    );
  }
}

import { compact, flatten, head } from 'lodash';
import * as ts from 'typescript';
import { ApiHideProperty } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
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

const metadataHostMap = new Map();

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
      if (ts.isClassDeclaration(node)) {
        node = ts.visitEachChild(node, visitNode, ctx);
        return this.addMetadataFactory(node as ts.ClassDeclaration);
      } else if (ts.isPropertyDeclaration(node)) {
        const decorators = node.decorators;
        const hidePropertyDecorator = getDecoratorOrUndefinedByNames(
          [ApiHideProperty.name],
          decorators
        );
        if (hidePropertyDecorator) {
          return node;
        }
        const isPropertyStatic = (node.modifiers || []).some(
          modifier => modifier.kind === ts.SyntaxKind.StaticKeyword
        );
        if (isPropertyStatic) {
          return node;
        }
        this.inspectPropertyDeclaration(
          node,
          typeChecker,
          options,
          sourceFile.fileName,
          sourceFile
        );
        return node;
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  addMetadataFactory(node: ts.ClassDeclaration) {
    const classMetadata = this.getClassMetadata(node as ts.ClassDeclaration);
    if (!classMetadata) {
      return node;
    }
    const classMutableNode = ts.getMutableClone(node);
    const returnValue = ts.createObjectLiteral(
      Object.keys(classMetadata).map(key =>
        ts.createPropertyAssignment(
          ts.createIdentifier(key),
          classMetadata[key]
        )
      )
    );
    const method = ts.createMethod(
      undefined,
      [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined,
      ts.createIdentifier(METADATA_FACTORY_NAME),
      undefined,
      undefined,
      [],
      undefined,
      ts.createBlock([ts.createReturn(returnValue)], true)
    );
    (classMutableNode as ts.ClassDeclaration).members = ts.createNodeArray([
      ...(classMutableNode as ts.ClassDeclaration).members,
      method
    ]);
    return classMutableNode;
  }

  inspectPropertyDeclaration(
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    hostFilename: string,
    sourceFile: ts.SourceFile
  ) {
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      compilerNode,
      typeChecker,
      ts.createNodeArray(),
      options,
      hostFilename
    );
    this.addClassMetadata(compilerNode, objectLiteralExpr, sourceFile);
  }

  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<
      ts.PropertyAssignment
    > = ts.createNodeArray(),
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
    const objectLiteral = ts.createObjectLiteral(compact(flatten(properties)));
    return objectLiteral;
  }

  createTypePropertyAssignment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
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
    if (ts.isTypeLiteralNode(node.type)) {
      const propertyAssignments = Array.from(node.type.members || []).map(
        member => {
          const literalExpr = this.createDecoratorObjectLiteralExpr(
            member as ts.PropertySignature,
            typeChecker,
            existingProperties,
            {},
            hostFilename
          );
          return ts.createPropertyAssignment(
            ts.createIdentifier(member.name.getText()),
            literalExpr
          );
        }
      );
      return ts.createPropertyAssignment(
        key,
        ts.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          ts.createParen(ts.createObjectLiteral(propertyAssignments))
        )
      );
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
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
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
    node: ts.PropertyDeclaration | ts.PropertySignature,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>
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
    node: ts.PropertyDeclaration | ts.PropertySignature
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

  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile
  ) {
    const hostClass = node.parent;
    const className = hostClass.name && hostClass.name.getText();
    if (!className) {
      return;
    }
    const existingMetadata = metadataHostMap.get(className) || {};
    const propertyName = node.name && node.name.getText(sourceFile);
    if (
      !propertyName ||
      (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)
    ) {
      return;
    }
    metadataHostMap.set(className, {
      ...existingMetadata,
      [propertyName]: objectLiteral
    });
  }

  getClassMetadata(node: ts.ClassDeclaration) {
    if (!node.name) {
      return;
    }
    return metadataHostMap.get(node.name.getText());
  }
}

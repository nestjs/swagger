import { compact, flatten, head } from 'lodash';
import * as ts from 'typescript';
import { ApiHideProperty } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import {
  findNullableTypeFromUnion,
  getDecoratorArguments,
  getMainCommentAndExamplesOfNode,
  getText,
  isEnum,
  isNull,
  isUndefined
} from '../utils/ast-utils';
import {
  extractTypeArgumentIfArray,
  getDecoratorOrUndefinedByNames,
  getTypeReferenceAsString,
  hasPropertyKey,
  isAutoGeneratedEnumUnion,
  isAutoGeneratedTypeUnion,
  replaceImportPath
} from '../utils/plugin-utils';
import { AbstractFileVisitor } from './abstract.visitor';

type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;

export class ModelClassVisitor extends AbstractFileVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ) {
    const typeChecker = program.getTypeChecker();
    sourceFile = this.updateImports(sourceFile, ctx.factory);

    const propertyNodeVisitorFactory =
      (metadata: ClassMetadata) =>
      (node: ts.Node): ts.Node => {
        if (ts.isPropertyDeclaration(node)) {
          const decorators = node.decorators;
          const hidePropertyDecorator = getDecoratorOrUndefinedByNames(
            [ApiHideProperty.name],
            decorators
          );
          if (hidePropertyDecorator) {
            return node;
          }

          const isPropertyStatic = (node.modifiers || []).some(
            (modifier: ts.Modifier) =>
              modifier.kind === ts.SyntaxKind.StaticKeyword
          );
          if (isPropertyStatic) {
            return node;
          }
          try {
            this.inspectPropertyDeclaration(
              node,
              typeChecker,
              options,
              sourceFile.fileName,
              sourceFile,
              metadata
            );
          } catch (err) {
            return node;
          }
        }
        return node;
      };

    const visitClassNode = (node: ts.Node): ts.Node => {
      if (ts.isClassDeclaration(node)) {
        const metadata: ClassMetadata = {};
        node = ts.visitEachChild(
          node,
          propertyNodeVisitorFactory(metadata),
          ctx
        );
        return this.addMetadataFactory(node as ts.ClassDeclaration, metadata);
      }
      return ts.visitEachChild(node, visitClassNode, ctx);
    };
    return ts.visitNode(sourceFile, visitClassNode);
  }

  addMetadataFactory(node: ts.ClassDeclaration, classMetadata: ClassMetadata) {
    const classMutableNode = ts.getMutableClone(node);
    const returnValue = ts.createObjectLiteral(
      Object.keys(classMetadata).map((key) =>
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
    (classMutableNode as ts.ClassDeclaration as any).members =
      ts.createNodeArray([
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
    sourceFile: ts.SourceFile,
    metadata: ClassMetadata
  ) {
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      compilerNode,
      typeChecker,
      ts.createNodeArray(),
      options,
      hostFilename,
      sourceFile
    );
    this.addClassMetadata(
      compilerNode,
      objectLiteralExpr,
      sourceFile,
      metadata
    );
  }

  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = ts.createNodeArray(),
    options: PluginOptions = {},
    hostFilename = '',
    sourceFile?: ts.SourceFile
  ): ts.ObjectLiteralExpression {
    const type = typeChecker.getTypeAtLocation(node);
    const isRequired = !node.questionToken;
    const isNullable = !!node.questionToken || isNull(type) || isUndefined(type);

    let properties = [
      ...existingProperties,
      !hasPropertyKey('required', existingProperties) &&
        ts.createPropertyAssignment('required', ts.createLiteral(isRequired)),
      !hasPropertyKey('nullable', existingProperties) && isNullable &&
        ts.createPropertyAssignment('nullable', ts.createLiteral(isNullable)),
      this.createTypePropertyAssignment(
        node.type,
        typeChecker,
        existingProperties,
        hostFilename
      ),
      ...this.createDescriptionAndExamplePropertyAssigments(
        node,
        typeChecker,
        existingProperties,
        options,
        sourceFile
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

  private createTypePropertyAssignment(
    node: ts.TypeNode,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string
  ): ts.PropertyAssignment {
    const key = 'type';
    if (hasPropertyKey(key, existingProperties)) {
      return undefined;
    }
    if (node) {
      if (ts.isTypeLiteralNode(node)) {
        const propertyAssignments = Array.from(node.members || []).map(
          (member) => {
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
      } else if (ts.isUnionTypeNode(node)) {
        const nullableType = findNullableTypeFromUnion(node, typeChecker);
        const remainingTypes = node.types.filter(
          (item) => item !== nullableType
        );

        // When we have more than 1 type left, we could use oneOf
        if (remainingTypes.length === 1) {
          return this.createTypePropertyAssignment(
            remainingTypes[0],
            typeChecker,
            existingProperties,
            hostFilename
          );
        }
      }
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
    if (isAutoGeneratedTypeUnion(type)) {
      const types = (type as ts.UnionOrIntersectionType).types;
      type = types[types.length - 1];
    }
    const typeIsArrayTuple = extractTypeArgumentIfArray(type);
    if (!typeIsArrayTuple) {
      return undefined;
    }
    let isArrayType = typeIsArrayTuple.isArray;
    type = typeIsArrayTuple.type;

    const isEnumMember =
      type.symbol && type.symbol.flags === ts.SymbolFlags.EnumMember;
    if (!isEnum(type) || isEnumMember) {
      if (!isEnumMember) {
        type = isAutoGeneratedEnumUnion(type, typeChecker);
      }
      if (!type) {
        return undefined;
      }
      const typeIsArrayTuple = extractTypeArgumentIfArray(type);
      if (!typeIsArrayTuple) {
        return undefined;
      }
      isArrayType = typeIsArrayTuple.isArray;
      type = typeIsArrayTuple.type;
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
    let initializer = node.initializer;
    if (!initializer) {
      return undefined;
    }
    if (ts.isAsExpression(initializer)) {
      initializer = initializer.expression;
    }
    return ts.createPropertyAssignment(key, ts.getMutableClone(initializer));
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
    if (argument) {
      assignments.push(
        ts.createPropertyAssignment(propertyKey, ts.getMutableClone(argument))
      );
    }
  }

  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile,
    metadata: ClassMetadata
  ) {
    const hostClass = node.parent;
    const className = hostClass.name && hostClass.name.getText();
    if (!className) {
      return;
    }
    const propertyName = node.name && node.name.getText(sourceFile);
    if (
      !propertyName ||
      (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)
    ) {
      return;
    }
    metadata[propertyName] = objectLiteral;
  }

  createDescriptionAndExamplePropertyAssigments(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = ts.createNodeArray(),
    options: PluginOptions = {},
    sourceFile?: ts.SourceFile
  ): ts.PropertyAssignment[] {
    if (!options.introspectComments || !sourceFile) {
      return [];
    }
    const propertyAssignments = [];
    const [comments, examples] = getMainCommentAndExamplesOfNode(
      node,
      sourceFile,
      typeChecker,
      true
    );

    const keyOfComment = options.dtoKeyOfComment;
    if (!hasPropertyKey(keyOfComment, existingProperties) && comments) {
      const descriptionPropertyAssignment = ts.createPropertyAssignment(
        keyOfComment,
        ts.createLiteral(comments)
      );
      propertyAssignments.push(descriptionPropertyAssignment);
    }

    const hasExampleOrExamplesKey =
      hasPropertyKey('example', existingProperties) ||
      hasPropertyKey('examples', existingProperties);

    if (!hasExampleOrExamplesKey && examples.length) {
      if (examples.length === 1) {
        const examplePropertyAssignment = ts.createPropertyAssignment(
          'example',
          this.createLiteralFromAnyValue(examples[0])
        );
        propertyAssignments.push(examplePropertyAssignment);
      } else {
        const examplesPropertyAssignment = ts.createPropertyAssignment(
          'examples',
          this.createLiteralFromAnyValue(examples)
        );
        propertyAssignments.push(examplesPropertyAssignment);
      }
    }
    return propertyAssignments;
  }

  private createLiteralFromAnyValue(item: any) {
    return Array.isArray(item)
      ? ts.createArrayLiteral(
          item.map((item) => this.createLiteralFromAnyValue(item))
        )
      : ts.createLiteral(item);
  }
}

import * as ts from 'typescript';
import { PropertyAssignment } from 'typescript';
import { PluginOptions } from '../merge-options';
import { AbstractFileVisitor } from './abstract.visitor';
type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;
export declare class ModelClassVisitor extends AbstractFileVisitor {
    private readonly _typeImports;
    private readonly _collectedMetadata;
    get typeImports(): Record<string, string>;
    collectedMetadata(options: PluginOptions): Array<[ts.CallExpression, Record<string, ClassMetadata>]>;
    visit(sourceFile: ts.SourceFile, ctx: ts.TransformationContext, program: ts.Program, options: PluginOptions): ts.Node;
    visitPropertyNodeDeclaration(node: ts.PropertyDeclaration, ctx: ts.TransformationContext, typeChecker: ts.TypeChecker, options: PluginOptions, sourceFile: ts.SourceFile, metadata: ClassMetadata): ts.PropertyDeclaration;
    visitConstructorDeclarationNode(constructorNode: ts.ConstructorDeclaration, typeChecker: ts.TypeChecker, options: PluginOptions, sourceFile: ts.SourceFile, metadata: ClassMetadata): void;
    addMetadataFactory(factory: ts.NodeFactory, node: ts.ClassDeclaration, classMetadata: ClassMetadata, sourceFile: ts.SourceFile, options: PluginOptions): ts.ClassDeclaration;
    inspectPropertyDeclaration(factory: ts.NodeFactory, compilerNode: ts.PropertyDeclaration, typeChecker: ts.TypeChecker, options: PluginOptions, hostFilename: string, sourceFile: ts.SourceFile, metadata: ClassMetadata): void;
    createDecoratorObjectLiteralExpr(factory: ts.NodeFactory, node: ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration, typeChecker: ts.TypeChecker, existingProperties?: ts.NodeArray<ts.PropertyAssignment>, options?: PluginOptions, hostFilename?: string, sourceFile?: ts.SourceFile): ts.ObjectLiteralExpression;
    private createTypePropertyAssignments;
    createInitializerForArrayLiteralTypeNode(node: ts.ArrayTypeNode, factory: ts.NodeFactory, typeChecker: ts.TypeChecker, existingProperties: ts.NodeArray<ts.PropertyAssignment>, hostFilename: string, options: PluginOptions): ts.ArrowFunction;
    createInitializerForTypeLiteralNode(node: ts.TypeLiteralNode, factory: ts.NodeFactory, typeChecker: ts.TypeChecker, existingProperties: ts.NodeArray<ts.PropertyAssignment>, hostFilename: string, options: PluginOptions): ts.ArrowFunction;
    isNullableUnion(node: ts.UnionTypeNode): {
        nullableType: ts.TypeNode;
        isNullable: boolean;
    };
    createEnumPropertyAssignment(factory: ts.NodeFactory, node: ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration, typeChecker: ts.TypeChecker, existingProperties: ts.NodeArray<ts.PropertyAssignment>, hostFilename: string, options: PluginOptions): ts.PropertyAssignment | ts.PropertyAssignment[];
    createDefaultPropertyAssignment(factory: ts.NodeFactory, node: ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration, existingProperties: ts.NodeArray<ts.PropertyAssignment>, options: PluginOptions): ts.PropertyAssignment;
    createValidationPropertyAssignments(factory: ts.NodeFactory, node: ts.PropertyDeclaration | ts.PropertySignature, options: PluginOptions): ts.PropertyAssignment[];
    addPropertyByValidationDecorator(factory: ts.NodeFactory, decoratorName: string, propertyKey: string, decorators: readonly ts.Decorator[], assignments: ts.PropertyAssignment[], options: PluginOptions): void;
    addPropertiesByValidationDecorator(factory: ts.NodeFactory, decoratorName: string, decorators: readonly ts.Decorator[], assignments: ts.PropertyAssignment[], addPropertyAssignments: (decoratorRef: ts.Decorator) => PropertyAssignment[]): void;
    addClassMetadata(node: ts.PropertyDeclaration, objectLiteral: ts.ObjectLiteralExpression, sourceFile: ts.SourceFile, metadata: ClassMetadata): void;
    createDescriptionAndTsDocTagPropertyAssignments(factory: ts.NodeFactory, node: ts.PropertyDeclaration | ts.PropertySignature | ts.ParameterDeclaration, typeChecker: ts.TypeChecker, existingProperties?: ts.NodeArray<ts.PropertyAssignment>, options?: PluginOptions, sourceFile?: ts.SourceFile): ts.PropertyAssignment[];
    private normalizeImportPath;
    private clonePrimitiveLiteral;
    private getInitializerPrimitiveTypeName;
}
export {};

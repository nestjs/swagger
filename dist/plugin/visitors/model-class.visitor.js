"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelClassVisitor = void 0;
const lodash_1 = require("lodash");
const path_1 = require("path");
const ts = require("typescript");
const typescript_1 = require("typescript");
const decorators_1 = require("../../decorators");
const decorators_properties_1 = require("../../services/decorators-properties");
const plugin_constants_1 = require("../plugin-constants");
const plugin_debug_logger_1 = require("../plugin-debug-logger");
const ast_utils_1 = require("../utils/ast-utils");
const plugin_utils_1 = require("../utils/plugin-utils");
const type_reference_to_identifier_util_1 = require("../utils/type-reference-to-identifier.util");
const abstract_visitor_1 = require("./abstract.visitor");
class ModelClassVisitor extends abstract_visitor_1.AbstractFileVisitor {
    constructor() {
        super(...arguments);
        this._typeImports = {};
        this._collectedMetadata = {};
    }
    get typeImports() {
        return this._typeImports;
    }
    collectedMetadata(options) {
        const metadataWithImports = [];
        Object.keys(this._collectedMetadata).forEach((filePath) => {
            const metadata = this._collectedMetadata[filePath];
            const fileExt = options.esmCompatible ? (0, plugin_utils_1.getOutputExtension)(filePath) : '';
            const path = filePath.replace(/\.[jt]s$/, fileExt);
            const importExpr = ts.factory.createCallExpression(ts.factory.createToken(ts.SyntaxKind.ImportKeyword), undefined, [ts.factory.createStringLiteral(path)]);
            metadataWithImports.push([importExpr, metadata]);
        });
        return metadataWithImports;
    }
    visit(sourceFile, ctx, program, options) {
        const typeChecker = program.getTypeChecker();
        sourceFile = this.updateImports(sourceFile, ctx.factory, program);
        const propertyNodeVisitorFactory = (metadata) => (node) => {
            const visit = () => {
                if (ts.isPropertyDeclaration(node)) {
                    this.visitPropertyNodeDeclaration(node, ctx, typeChecker, options, sourceFile, metadata);
                }
                else if (options.parameterProperties &&
                    ts.isConstructorDeclaration(node)) {
                    this.visitConstructorDeclarationNode(node, typeChecker, options, sourceFile, metadata);
                }
                return node;
            };
            const visitedNode = visit();
            if (!options.readonly) {
                return visitedNode;
            }
        };
        const visitClassNode = (node) => {
            var _a;
            if (ts.isClassDeclaration(node)) {
                const metadata = {};
                const isExported = (_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
                if (options.readonly) {
                    if (isExported) {
                        ts.forEachChild(node, propertyNodeVisitorFactory(metadata));
                    }
                    else {
                        if (options.debug) {
                            plugin_debug_logger_1.pluginDebugLogger.debug(`Skipping class "${node.name.getText()}" because it's not exported.`);
                        }
                    }
                }
                else {
                    node = ts.visitEachChild(node, propertyNodeVisitorFactory(metadata), ctx);
                }
                if ((isExported && options.readonly) || !options.readonly) {
                    const declaration = this.addMetadataFactory(ctx.factory, node, metadata, sourceFile, options);
                    if (!options.readonly) {
                        return declaration;
                    }
                }
            }
            if (options.readonly) {
                ts.forEachChild(node, visitClassNode);
            }
            else {
                return ts.visitEachChild(node, visitClassNode, ctx);
            }
        };
        return ts.visitNode(sourceFile, visitClassNode);
    }
    visitPropertyNodeDeclaration(node, ctx, typeChecker, options, sourceFile, metadata) {
        const isPropertyStatic = (node.modifiers || []).some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
        if (isPropertyStatic) {
            return node;
        }
        const isPrivateProperty = ts.isPrivateIdentifier(node.name);
        if (isPrivateProperty) {
            return node;
        }
        const decorators = ts.canHaveDecorators(node) && ts.getDecorators(node);
        const classTransformerShim = options.classTransformerShim;
        const hidePropertyDecoratorExists = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)(classTransformerShim
            ? [decorators_1.ApiHideProperty.name, 'Exclude']
            : [decorators_1.ApiHideProperty.name], decorators, typescript_1.factory);
        const annotatePropertyDecoratorExists = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)(classTransformerShim ? [decorators_1.ApiProperty.name, 'Expose'] : [decorators_1.ApiProperty.name], decorators, typescript_1.factory);
        if (!annotatePropertyDecoratorExists &&
            (hidePropertyDecoratorExists || classTransformerShim === 'exclusive')) {
            return node;
        }
        else if (annotatePropertyDecoratorExists && hidePropertyDecoratorExists) {
            plugin_debug_logger_1.pluginDebugLogger.debug(`"${node.parent.name.getText()}->${node.name.getText()}" has conflicting decorators, excluding as @ApiHideProperty() takes priority.`);
            return node;
        }
        try {
            this.inspectPropertyDeclaration(ctx.factory, node, typeChecker, options, sourceFile.fileName, sourceFile, metadata);
        }
        catch (err) {
            return node;
        }
    }
    visitConstructorDeclarationNode(constructorNode, typeChecker, options, sourceFile, metadata) {
        constructorNode.forEachChild((node) => {
            if (ts.isParameter(node) &&
                node.modifiers != null &&
                node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword ||
                    modifier.kind === ts.SyntaxKind.PrivateKeyword ||
                    modifier.kind === ts.SyntaxKind.PublicKeyword ||
                    modifier.kind === ts.SyntaxKind.ProtectedKeyword)) {
                const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(typescript_1.factory, node, typeChecker, typescript_1.factory.createNodeArray(), options, sourceFile.fileName, sourceFile);
                const propertyName = node.name.getText();
                metadata[propertyName] = objectLiteralExpr;
            }
        });
    }
    addMetadataFactory(factory, node, classMetadata, sourceFile, options) {
        const returnValue = factory.createObjectLiteralExpression(Object.keys(classMetadata).map((key) => factory.createPropertyAssignment(factory.createIdentifier(key), classMetadata[key])));
        if (options.readonly) {
            const filePath = this.normalizeImportPath(options.pathToSource, sourceFile.fileName);
            if (!this._collectedMetadata[filePath]) {
                this._collectedMetadata[filePath] = {};
            }
            const attributeKey = node.name.getText();
            this._collectedMetadata[filePath][attributeKey] = returnValue;
            return;
        }
        const method = factory.createMethodDeclaration([factory.createModifier(ts.SyntaxKind.StaticKeyword)], undefined, factory.createIdentifier(plugin_constants_1.METADATA_FACTORY_NAME), undefined, undefined, [], undefined, factory.createBlock([factory.createReturnStatement(returnValue)], true));
        return factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, [...node.members, method]);
    }
    inspectPropertyDeclaration(factory, compilerNode, typeChecker, options, hostFilename, sourceFile, metadata) {
        const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(factory, compilerNode, typeChecker, factory.createNodeArray(), options, hostFilename, sourceFile);
        this.addClassMetadata(compilerNode, objectLiteralExpr, sourceFile, metadata);
    }
    createDecoratorObjectLiteralExpr(factory, node, typeChecker, existingProperties = factory.createNodeArray(), options = {}, hostFilename = '', sourceFile) {
        const isRequired = !node.questionToken;
        const properties = [
            ...existingProperties,
            !(0, plugin_utils_1.hasPropertyKey)('required', existingProperties) &&
                factory.createPropertyAssignment('required', (0, ast_utils_1.createBooleanLiteral)(factory, isRequired)),
            ...this.createTypePropertyAssignments(factory, node.type, typeChecker, existingProperties, hostFilename, options),
            ...this.createDescriptionAndTsDocTagPropertyAssignments(factory, node, typeChecker, existingProperties, options, sourceFile),
            this.createDefaultPropertyAssignment(factory, node, existingProperties, options),
            this.createEnumPropertyAssignment(factory, node, typeChecker, existingProperties, hostFilename, options)
        ];
        if ((ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) &&
            options.classValidatorShim) {
            properties.push(this.createValidationPropertyAssignments(factory, node, options));
        }
        return factory.createObjectLiteralExpression((0, lodash_1.compact)((0, lodash_1.flatten)(properties)));
    }
    createTypePropertyAssignments(factory, node, typeChecker, existingProperties, hostFilename, options) {
        const key = 'type';
        if ((0, plugin_utils_1.hasPropertyKey)(key, existingProperties)) {
            return [];
        }
        if (node) {
            if (ts.isArrayTypeNode(node) && ts.isTypeLiteralNode(node.elementType)) {
                const initializer = this.createInitializerForArrayLiteralTypeNode(node, factory, typeChecker, existingProperties, hostFilename, options);
                return [factory.createPropertyAssignment(key, initializer)];
            }
            if (ts.isTypeLiteralNode(node)) {
                const initializer = this.createInitializerForTypeLiteralNode(node, factory, typeChecker, existingProperties, hostFilename, options);
                return [factory.createPropertyAssignment(key, initializer)];
            }
            if (ts.isUnionTypeNode(node)) {
                const { nullableType, isNullable } = this.isNullableUnion(node);
                const remainingTypes = node.types.filter((t) => t !== nullableType);
                if (remainingTypes.length === 1) {
                    const nonNullishNode = remainingTypes[0];
                    const resolved = typeChecker.getTypeAtLocation(nonNullishNode);
                    let candidateType = resolved;
                    const arrayTuple = (0, plugin_utils_1.extractTypeArgumentIfArray)(candidateType);
                    if (arrayTuple) {
                        candidateType = arrayTuple.type;
                    }
                    let isEnumType = false;
                    if (candidateType) {
                        if ((0, ast_utils_1.isEnum)(candidateType)) {
                            isEnumType = true;
                        }
                        else {
                            const maybeEnum = (0, plugin_utils_1.isAutoGeneratedEnumUnion)(candidateType, typeChecker);
                            if (maybeEnum) {
                                isEnumType = true;
                            }
                        }
                    }
                    if (isEnumType) {
                        return isNullable
                            ? [
                                factory.createPropertyAssignment('nullable', (0, ast_utils_1.createBooleanLiteral)(factory, true))
                            ]
                            : [];
                    }
                    const propertyAssignments = this.createTypePropertyAssignments(factory, nonNullishNode, typeChecker, existingProperties, hostFilename, options);
                    if (!isNullable) {
                        return propertyAssignments;
                    }
                    return [
                        ...propertyAssignments,
                        factory.createPropertyAssignment('nullable', (0, ast_utils_1.createBooleanLiteral)(factory, true))
                    ];
                }
            }
        }
        const type = typeChecker.getTypeAtLocation(node);
        if (!type) {
            return [];
        }
        const typeReferenceDescriptor = (0, plugin_utils_1.getTypeReferenceAsString)(type, typeChecker);
        if (!typeReferenceDescriptor.typeName) {
            return [];
        }
        const identifier = (0, type_reference_to_identifier_util_1.typeReferenceToIdentifier)(typeReferenceDescriptor, hostFilename, options, factory, type, this._typeImports);
        const initializer = factory.createArrowFunction(undefined, undefined, [], undefined, undefined, identifier);
        return [factory.createPropertyAssignment(key, initializer)];
    }
    createInitializerForArrayLiteralTypeNode(node, factory, typeChecker, existingProperties, hostFilename, options) {
        const elementType = node.elementType;
        const propertyAssignments = Array.from(elementType.members || []).map((member) => {
            const literalExpr = this.createDecoratorObjectLiteralExpr(factory, member, typeChecker, existingProperties, options, hostFilename);
            return factory.createPropertyAssignment(factory.createIdentifier(member.name.getText()), literalExpr);
        });
        const initializer = factory.createArrowFunction(undefined, undefined, [], undefined, undefined, factory.createArrayLiteralExpression([
            factory.createParenthesizedExpression(factory.createObjectLiteralExpression(propertyAssignments))
        ]));
        return initializer;
    }
    createInitializerForTypeLiteralNode(node, factory, typeChecker, existingProperties, hostFilename, options) {
        const propertyAssignments = Array.from(node.members || []).map((member) => {
            const literalExpr = this.createDecoratorObjectLiteralExpr(factory, member, typeChecker, existingProperties, options, hostFilename);
            return factory.createPropertyAssignment(factory.createIdentifier(member.name.getText()), literalExpr);
        });
        const initializer = factory.createArrowFunction(undefined, undefined, [], undefined, undefined, factory.createParenthesizedExpression(factory.createObjectLiteralExpression(propertyAssignments)));
        return initializer;
    }
    isNullableUnion(node) {
        const nullableType = node.types.find((type) => type.kind === ts.SyntaxKind.NullKeyword ||
            (ts.SyntaxKind.LiteralType && type.getText() === 'null'));
        const isNullable = !!nullableType;
        return { nullableType, isNullable };
    }
    createEnumPropertyAssignment(factory, node, typeChecker, existingProperties, hostFilename, options) {
        const key = 'enum';
        if ((0, plugin_utils_1.hasPropertyKey)(key, existingProperties)) {
            return undefined;
        }
        let type;
        try {
            if (node.type) {
                type = typeChecker.getTypeFromTypeNode(node.type);
            }
        }
        catch (e) {
        }
        if (!type) {
            type = typeChecker.getTypeAtLocation(node);
        }
        if (!type) {
            return undefined;
        }
        if ((type.flags & ts.TypeFlags.Union) !== 0) {
            const union = type;
            const nonNullish = union.types.filter((t) => (t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)) === 0);
            if (nonNullish.length === 1) {
                type = nonNullish[0];
            }
        }
        if ((0, plugin_utils_1.isAutoGeneratedTypeUnion)(type)) {
            const types = type.types;
            const nonUndefined = types.find((t) => t.intrinsicName !== 'undefined');
            if (nonUndefined) {
                type = nonUndefined;
            }
        }
        if ((0, plugin_utils_1.isAutoGeneratedTypeUnion)(type)) {
            const types = type.types;
            type = types[types.length - 1];
        }
        const typeIsArrayTuple = (0, plugin_utils_1.extractTypeArgumentIfArray)(type);
        if (!typeIsArrayTuple) {
            return undefined;
        }
        const isArrayType = typeIsArrayTuple.isArray;
        type = typeIsArrayTuple.type;
        const isEnumMember = type.symbol && type.symbol.flags === ts.SymbolFlags.EnumMember;
        if (!(0, ast_utils_1.isEnum)(type) || isEnumMember) {
            if (!isEnumMember) {
                type = (0, plugin_utils_1.isAutoGeneratedEnumUnion)(type, typeChecker);
            }
            if (!type) {
                return undefined;
            }
            const typeIsArrayTuple = (0, plugin_utils_1.extractTypeArgumentIfArray)(type);
            if (!typeIsArrayTuple) {
                return undefined;
            }
            type = typeIsArrayTuple.type;
        }
        const typeReferenceDescriptor = { typeName: (0, ast_utils_1.getText)(type, typeChecker) };
        const enumIdentifier = (0, type_reference_to_identifier_util_1.typeReferenceToIdentifier)(typeReferenceDescriptor, hostFilename, options, factory, type, this._typeImports);
        const enumProperty = factory.createPropertyAssignment(key, enumIdentifier);
        if (isArrayType) {
            const isArrayKey = 'isArray';
            const isArrayProperty = factory.createPropertyAssignment(isArrayKey, factory.createIdentifier('true'));
            return [enumProperty, isArrayProperty];
        }
        return enumProperty;
    }
    createDefaultPropertyAssignment(factory, node, existingProperties, options) {
        var _a;
        const key = 'default';
        if (options.skipDefaultValues) {
            return undefined;
        }
        if ((0, plugin_utils_1.hasPropertyKey)(key, existingProperties)) {
            return undefined;
        }
        if (ts.isPropertySignature(node)) {
            return undefined;
        }
        if (node.initializer == null) {
            return undefined;
        }
        let initializer = node.initializer;
        if (ts.isAsExpression(initializer)) {
            initializer = initializer.expression;
        }
        initializer =
            (_a = this.clonePrimitiveLiteral(factory, initializer)) !== null && _a !== void 0 ? _a : initializer;
        if (!(0, plugin_utils_1.canReferenceNode)(initializer, options)) {
            const parentFilePath = node.getSourceFile().fileName;
            const propertyName = node.name.getText();
            plugin_debug_logger_1.pluginDebugLogger.debug(`Skipping registering default value for "${propertyName}" property in "${parentFilePath}" file because it is not a referenceable value ("${initializer.getText()}").`);
            return undefined;
        }
        return factory.createPropertyAssignment(key, initializer);
    }
    createValidationPropertyAssignments(factory, node, options) {
        const assignments = [];
        const decorators = ts.canHaveDecorators(node) && ts.getDecorators(node);
        if (!options.readonly) {
            this.addPropertyByValidationDecorator(factory, 'IsIn', 'enum', decorators, assignments, options);
        }
        decorators_properties_1.decoratorsProperties.forEach((decoratorProperty) => {
            if (decoratorProperty.mappingType === decorators_properties_1.decoratorsPropertiesMappingType.DIRECT) {
                this.addPropertyByValidationDecorator(factory, decoratorProperty.decorator, decoratorProperty.property, decorators, assignments, options);
            }
            else if (decoratorProperty.mappingType ===
                decorators_properties_1.decoratorsPropertiesMappingType.INDIRECT_VALUE) {
                this.addPropertiesByValidationDecorator(factory, decoratorProperty.decorator, decorators, assignments, () => {
                    return [
                        factory.createPropertyAssignment(decoratorProperty.property, (0, ast_utils_1.createPrimitiveLiteral)(factory, decoratorProperty.value))
                    ];
                });
            }
            else if (decoratorProperty.mappingType ===
                decorators_properties_1.decoratorsPropertiesMappingType.INDIRECT_ARGUMENT) {
                this.addPropertiesByValidationDecorator(factory, decoratorProperty.decorator, decorators, assignments, (decoratorRef) => {
                    const decoratorArguments = (0, ast_utils_1.getDecoratorArguments)(decoratorRef);
                    const result = [];
                    const argumentValue = (0, lodash_1.head)(decoratorArguments);
                    if (!(0, plugin_utils_1.canReferenceNode)(argumentValue, options)) {
                        return result;
                    }
                    const clonedArgumentValue = this.clonePrimitiveLiteral(factory, argumentValue);
                    if (clonedArgumentValue) {
                        result.push(factory.createPropertyAssignment(decoratorProperty.property, clonedArgumentValue));
                    }
                    return result;
                });
            }
        });
        this.addPropertiesByValidationDecorator(factory, 'Length', decorators, assignments, (decoratorRef) => {
            var _a, _b;
            const decoratorArguments = (0, ast_utils_1.getDecoratorArguments)(decoratorRef);
            const result = [];
            const minLength = (0, lodash_1.head)(decoratorArguments);
            if (!(0, plugin_utils_1.canReferenceNode)(minLength, options)) {
                return result;
            }
            const clonedMinLength = (_a = this.clonePrimitiveLiteral(factory, minLength)) !== null && _a !== void 0 ? _a : minLength;
            if (clonedMinLength) {
                result.push(factory.createPropertyAssignment('minLength', clonedMinLength));
            }
            if (decoratorArguments.length > 1) {
                const maxLength = decoratorArguments[1];
                if (!(0, plugin_utils_1.canReferenceNode)(maxLength, options)) {
                    return result;
                }
                const clonedMaxLength = (_b = this.clonePrimitiveLiteral(factory, maxLength)) !== null && _b !== void 0 ? _b : maxLength;
                if (clonedMaxLength) {
                    result.push(factory.createPropertyAssignment('maxLength', clonedMaxLength));
                }
            }
            return result;
        });
        this.addPropertiesByValidationDecorator(factory, 'Matches', decorators, assignments, (decoratorRef) => {
            const decoratorArguments = (0, ast_utils_1.getDecoratorArguments)(decoratorRef);
            return [
                factory.createPropertyAssignment('pattern', (0, ast_utils_1.createPrimitiveLiteral)(factory, (0, lodash_1.head)(decoratorArguments).text))
            ];
        });
        return assignments;
    }
    addPropertyByValidationDecorator(factory, decoratorName, propertyKey, decorators, assignments, options) {
        this.addPropertiesByValidationDecorator(factory, decoratorName, decorators, assignments, (decoratorRef) => {
            var _a;
            const argument = (0, lodash_1.head)((0, ast_utils_1.getDecoratorArguments)(decoratorRef));
            const assignment = (_a = this.clonePrimitiveLiteral(factory, argument)) !== null && _a !== void 0 ? _a : argument;
            if (!(0, plugin_utils_1.canReferenceNode)(assignment, options)) {
                return [];
            }
            return [factory.createPropertyAssignment(propertyKey, assignment)];
        });
    }
    addPropertiesByValidationDecorator(factory, decoratorName, decorators, assignments, addPropertyAssignments) {
        const decoratorRef = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)([decoratorName], decorators, factory);
        if (!decoratorRef) {
            return;
        }
        assignments.push(...addPropertyAssignments(decoratorRef));
    }
    addClassMetadata(node, objectLiteral, sourceFile, metadata) {
        const hostClass = node.parent;
        const className = hostClass.name && hostClass.name.getText();
        if (!className) {
            return;
        }
        const propertyName = node.name && node.name.getText(sourceFile);
        if (!propertyName ||
            (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)) {
            return;
        }
        metadata[propertyName] = objectLiteral;
    }
    createDescriptionAndTsDocTagPropertyAssignments(factory, node, typeChecker, existingProperties = factory.createNodeArray(), options = {}, sourceFile) {
        var _a;
        if (!options.introspectComments || !sourceFile) {
            return [];
        }
        const propertyAssignments = [];
        const comments = (0, ast_utils_1.getMainCommentOfNode)(node);
        const tags = (0, ast_utils_1.getTsDocTagsOfNode)(node, typeChecker);
        const keyOfComment = options.dtoKeyOfComment;
        if (!(0, plugin_utils_1.hasPropertyKey)(keyOfComment, existingProperties) && comments) {
            const descriptionPropertyAssignment = factory.createPropertyAssignment(keyOfComment, factory.createStringLiteral(comments));
            propertyAssignments.push(descriptionPropertyAssignment);
        }
        const hasExampleOrExamplesKey = (0, plugin_utils_1.hasPropertyKey)('example', existingProperties) ||
            (0, plugin_utils_1.hasPropertyKey)('examples', existingProperties);
        if (!hasExampleOrExamplesKey && ((_a = tags.example) === null || _a === void 0 ? void 0 : _a.length)) {
            if (tags.example.length === 1) {
                const examplePropertyAssignment = factory.createPropertyAssignment('example', (0, ast_utils_1.createLiteralFromAnyValue)(factory, tags.example[0]));
                propertyAssignments.push(examplePropertyAssignment);
            }
            else {
                const examplesPropertyAssignment = factory.createPropertyAssignment('examples', (0, ast_utils_1.createLiteralFromAnyValue)(factory, tags.example));
                propertyAssignments.push(examplesPropertyAssignment);
            }
        }
        const hasDeprecatedKey = (0, plugin_utils_1.hasPropertyKey)('deprecated', existingProperties);
        if (!hasDeprecatedKey && tags.deprecated) {
            const deprecatedPropertyAssignment = factory.createPropertyAssignment('deprecated', (0, ast_utils_1.createLiteralFromAnyValue)(factory, tags.deprecated));
            propertyAssignments.push(deprecatedPropertyAssignment);
        }
        return propertyAssignments;
    }
    normalizeImportPath(pathToSource, path) {
        let relativePath = path_1.posix.relative((0, plugin_utils_1.convertPath)(pathToSource), (0, plugin_utils_1.convertPath)(path));
        relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;
        return relativePath;
    }
    clonePrimitiveLiteral(factory, node) {
        var _a;
        const primitiveTypeName = this.getInitializerPrimitiveTypeName(node);
        if (!primitiveTypeName) {
            return undefined;
        }
        const text = (_a = node.text) !== null && _a !== void 0 ? _a : node.getText();
        return (0, ast_utils_1.createPrimitiveLiteral)(factory, text, primitiveTypeName);
    }
    getInitializerPrimitiveTypeName(node) {
        if (ts.isIdentifier(node) &&
            (node.text === 'true' || node.text === 'false')) {
            return 'boolean';
        }
        if (ts.isNumericLiteral(node) || ts.isPrefixUnaryExpression(node)) {
            return 'number';
        }
        if (ts.isStringLiteral(node)) {
            return 'string';
        }
        return undefined;
    }
}
exports.ModelClassVisitor = ModelClassVisitor;

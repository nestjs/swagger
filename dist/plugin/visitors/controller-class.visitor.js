"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerClassVisitor = void 0;
const lodash_1 = require("lodash");
const path_1 = require("path");
const ts = require("typescript");
const decorators_1 = require("../../decorators");
const plugin_constants_1 = require("../plugin-constants");
const ast_utils_1 = require("../utils/ast-utils");
const plugin_utils_1 = require("../utils/plugin-utils");
const type_reference_to_identifier_util_1 = require("../utils/type-reference-to-identifier.util");
const abstract_visitor_1 = require("./abstract.visitor");
class ControllerClassVisitor extends abstract_visitor_1.AbstractFileVisitor {
    constructor() {
        super(...arguments);
        this._collectedMetadata = {};
        this._typeImports = {};
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
        if (!options.readonly) {
            sourceFile = this.updateImports(sourceFile, ctx.factory, program);
        }
        const visitNode = (node) => {
            var _a;
            if (ts.isMethodDeclaration(node)) {
                try {
                    const metadata = {};
                    const updatedNode = this.addDecoratorToNode(ctx.factory, node, typeChecker, options, sourceFile, metadata);
                    if (!options.readonly) {
                        return updatedNode;
                    }
                    else {
                        const filePath = this.normalizeImportPath(options.pathToSource, sourceFile.fileName);
                        if (!this._collectedMetadata[filePath]) {
                            this._collectedMetadata[filePath] = {};
                        }
                        const parent = node.parent;
                        const clsName = (_a = parent.name) === null || _a === void 0 ? void 0 : _a.getText();
                        if (clsName) {
                            if (!this._collectedMetadata[filePath][clsName]) {
                                this._collectedMetadata[filePath][clsName] = {};
                            }
                            Object.assign(this._collectedMetadata[filePath][clsName], metadata);
                        }
                    }
                }
                catch (_b) {
                    if (!options.readonly) {
                        return node;
                    }
                }
            }
            if (options.readonly) {
                ts.forEachChild(node, visitNode);
            }
            else {
                return ts.visitEachChild(node, visitNode, ctx);
            }
        };
        return ts.visitNode(sourceFile, visitNode);
    }
    addDecoratorToNode(factory, compilerNode, typeChecker, options, sourceFile, metadata) {
        var _a;
        const hostFilename = sourceFile.fileName;
        const decorators = ts.canHaveDecorators(compilerNode) && ts.getDecorators(compilerNode);
        if (!decorators) {
            return compilerNode;
        }
        const apiOperationDecoratorsArray = this.createApiOperationDecorator(factory, compilerNode, decorators, options, sourceFile, typeChecker, metadata);
        const apiResponseDecoratorsArray = this.createApiResponseDecorator(factory, compilerNode, options, metadata);
        const removeExistingApiOperationDecorator = apiOperationDecoratorsArray.length > 0;
        const existingDecorators = removeExistingApiOperationDecorator
            ? decorators.filter((item) => (0, ast_utils_1.getDecoratorName)(item) !== decorators_1.ApiOperation.name)
            : decorators;
        const modifiers = (_a = ts.getModifiers(compilerNode)) !== null && _a !== void 0 ? _a : [];
        const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(factory, compilerNode, typeChecker, factory.createNodeArray(), hostFilename, metadata, options);
        const updatedDecorators = [
            ...apiOperationDecoratorsArray,
            ...apiResponseDecoratorsArray,
            ...existingDecorators,
            factory.createDecorator(factory.createCallExpression(factory.createIdentifier(`${plugin_constants_1.OPENAPI_NAMESPACE}.${decorators_1.ApiResponse.name}`), undefined, [factory.createObjectLiteralExpression(objectLiteralExpr.properties)]))
        ];
        if (!options.readonly) {
            return factory.updateMethodDeclaration(compilerNode, [...updatedDecorators, ...modifiers], compilerNode.asteriskToken, compilerNode.name, compilerNode.questionToken, compilerNode.typeParameters, compilerNode.parameters, compilerNode.type, compilerNode.body);
        }
        else {
            return compilerNode;
        }
    }
    createApiOperationDecorator(factory, node, decorators, options, sourceFile, typeChecker, metadata) {
        if (!options.introspectComments) {
            return [];
        }
        const apiOperationDecorator = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)([decorators_1.ApiOperation.name], decorators, factory);
        let apiOperationExistingProps = undefined;
        if (apiOperationDecorator && !options.readonly) {
            const apiOperationExpr = (0, lodash_1.head)((0, ast_utils_1.getDecoratorArguments)(apiOperationDecorator));
            if (apiOperationExpr) {
                apiOperationExistingProps =
                    apiOperationExpr.properties;
            }
        }
        const extractedComments = (0, ast_utils_1.getMainCommentOfNode)(node);
        if (!extractedComments) {
            return [];
        }
        const properties = [
            ...(apiOperationExistingProps !== null && apiOperationExistingProps !== void 0 ? apiOperationExistingProps : factory.createNodeArray())
        ];
        const tags = (0, ast_utils_1.getTsDocTagsOfNode)(node, typeChecker);
        const hasRemarksKey = (0, plugin_utils_1.hasPropertyKey)('description', factory.createNodeArray(apiOperationExistingProps));
        if (!hasRemarksKey && tags.remarks) {
            const remarksPropertyAssignment = factory.createPropertyAssignment('description', (0, ast_utils_1.createLiteralFromAnyValue)(factory, tags.remarks));
            properties.push(remarksPropertyAssignment);
            if (options.controllerKeyOfComment === 'description') {
                properties.unshift(factory.createPropertyAssignment('summary', factory.createStringLiteral(extractedComments)));
            }
            else {
                const keyToGenerate = options.controllerKeyOfComment;
                properties.unshift(factory.createPropertyAssignment(keyToGenerate, factory.createStringLiteral(extractedComments)));
            }
        }
        else {
            const keyToGenerate = options.controllerKeyOfComment;
            properties.unshift(factory.createPropertyAssignment(keyToGenerate, factory.createStringLiteral(extractedComments)));
        }
        const hasDeprecatedKey = (0, plugin_utils_1.hasPropertyKey)('deprecated', factory.createNodeArray(apiOperationExistingProps));
        if (!hasDeprecatedKey && tags.deprecated) {
            const deprecatedPropertyAssignment = factory.createPropertyAssignment('deprecated', (0, ast_utils_1.createLiteralFromAnyValue)(factory, tags.deprecated));
            properties.push(deprecatedPropertyAssignment);
        }
        const objectLiteralExpr = factory.createObjectLiteralExpression((0, lodash_1.compact)(properties));
        const apiOperationDecoratorArguments = factory.createNodeArray([objectLiteralExpr]);
        const methodKey = node.name.getText();
        if (metadata[methodKey]) {
            const existingObjectLiteralExpr = metadata[methodKey];
            const existingProperties = existingObjectLiteralExpr.properties;
            const updatedProperties = factory.createNodeArray([
                ...existingProperties,
                ...(0, lodash_1.compact)(properties)
            ]);
            const updatedObjectLiteralExpr = factory.createObjectLiteralExpression(updatedProperties);
            metadata[methodKey] = updatedObjectLiteralExpr;
        }
        else {
            metadata[methodKey] = objectLiteralExpr;
        }
        if (apiOperationDecorator) {
            const expr = apiOperationDecorator.expression;
            const updatedCallExpr = factory.updateCallExpression(expr, expr.expression, undefined, apiOperationDecoratorArguments);
            return [factory.updateDecorator(apiOperationDecorator, updatedCallExpr)];
        }
        else {
            return [
                factory.createDecorator(factory.createCallExpression(factory.createIdentifier(`${plugin_constants_1.OPENAPI_NAMESPACE}.${decorators_1.ApiOperation.name}`), undefined, apiOperationDecoratorArguments))
            ];
        }
    }
    createApiResponseDecorator(factory, node, options, metadata) {
        if (!options.introspectComments) {
            return [];
        }
        const tags = (0, ast_utils_1.getTsDocErrorsOfNode)(node);
        if (!tags.length) {
            return [];
        }
        return tags.map((tag) => {
            const properties = [];
            properties.push(factory.createPropertyAssignment('status', factory.createNumericLiteral(tag.status)));
            properties.push(factory.createPropertyAssignment('description', factory.createNumericLiteral(tag.description)));
            const objectLiteralExpr = factory.createObjectLiteralExpression((0, lodash_1.compact)(properties));
            const methodKey = node.name.getText();
            metadata[methodKey] = objectLiteralExpr;
            const apiResponseDecoratorArguments = factory.createNodeArray([objectLiteralExpr]);
            return factory.createDecorator(factory.createCallExpression(factory.createIdentifier(`${plugin_constants_1.OPENAPI_NAMESPACE}.${decorators_1.ApiResponse.name}`), undefined, apiResponseDecoratorArguments));
        });
    }
    createDecoratorObjectLiteralExpr(factory, node, typeChecker, existingProperties = factory.createNodeArray(), hostFilename, metadata, options) {
        let properties = [];
        if (!options.readonly && !options.skipAutoHttpCode) {
            properties = properties.concat(existingProperties, this.createStatusPropertyAssignment(factory, node, existingProperties));
        }
        properties = properties.concat([
            this.createTypePropertyAssignment(factory, node, typeChecker, existingProperties, hostFilename, options)
        ]);
        const objectLiteralExpr = factory.createObjectLiteralExpression((0, lodash_1.compact)(properties));
        const methodKey = node.name.getText();
        const existingExprOrUndefined = metadata[methodKey];
        if (existingExprOrUndefined) {
            const existingProperties = existingExprOrUndefined.properties;
            const updatedProperties = factory.createNodeArray([
                ...existingProperties,
                ...(0, lodash_1.compact)(properties)
            ]);
            const updatedObjectLiteralExpr = factory.createObjectLiteralExpression(updatedProperties);
            metadata[methodKey] = updatedObjectLiteralExpr;
        }
        else {
            metadata[methodKey] = objectLiteralExpr;
        }
        return objectLiteralExpr;
    }
    createTypePropertyAssignment(factory, node, typeChecker, existingProperties, hostFilename, options) {
        if ((0, plugin_utils_1.hasPropertyKey)('type', existingProperties)) {
            return undefined;
        }
        const signature = typeChecker.getSignatureFromDeclaration(node);
        const type = typeChecker.getReturnTypeOfSignature(signature);
        if (!type) {
            return undefined;
        }
        const typeReferenceDescriptor = (0, plugin_utils_1.getTypeReferenceAsString)(type, typeChecker);
        if (!typeReferenceDescriptor.typeName) {
            return undefined;
        }
        if (typeReferenceDescriptor.typeName.includes('node_modules')) {
            return undefined;
        }
        const identifier = (0, type_reference_to_identifier_util_1.typeReferenceToIdentifier)(typeReferenceDescriptor, hostFilename, options, factory, type, this._typeImports);
        return factory.createPropertyAssignment('type', identifier);
    }
    createStatusPropertyAssignment(factory, node, existingProperties) {
        if ((0, plugin_utils_1.hasPropertyKey)('status', existingProperties)) {
            return undefined;
        }
        const statusNode = this.getStatusCodeIdentifier(factory, node);
        return factory.createPropertyAssignment('status', statusNode);
    }
    getStatusCodeIdentifier(factory, node) {
        const decorators = ts.canHaveDecorators(node) && ts.getDecorators(node);
        const httpCodeDecorator = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)(['HttpCode'], decorators, factory);
        if (httpCodeDecorator) {
            const argument = (0, lodash_1.head)((0, ast_utils_1.getDecoratorArguments)(httpCodeDecorator));
            if (argument) {
                return argument;
            }
        }
        const postDecorator = (0, plugin_utils_1.getDecoratorOrUndefinedByNames)(['Post'], decorators, factory);
        if (postDecorator) {
            return factory.createIdentifier('201');
        }
        return factory.createIdentifier('200');
    }
    normalizeImportPath(pathToSource, path) {
        let relativePath = path_1.posix.relative((0, plugin_utils_1.convertPath)(pathToSource), (0, plugin_utils_1.convertPath)(path));
        relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;
        return relativePath;
    }
}
exports.ControllerClassVisitor = ControllerClassVisitor;

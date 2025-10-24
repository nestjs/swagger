"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDocNode = renderDocNode;
exports.isArray = isArray;
exports.getTypeArguments = getTypeArguments;
exports.isBoolean = isBoolean;
exports.isString = isString;
exports.isStringLiteral = isStringLiteral;
exports.isStringMapping = isStringMapping;
exports.isNumber = isNumber;
exports.isBigInt = isBigInt;
exports.isInterface = isInterface;
exports.isEnum = isEnum;
exports.isEnumLiteral = isEnumLiteral;
exports.hasFlag = hasFlag;
exports.hasObjectFlag = hasObjectFlag;
exports.getText = getText;
exports.getDefaultTypeFormatFlags = getDefaultTypeFormatFlags;
exports.getDocComment = getDocComment;
exports.getMainCommentOfNode = getMainCommentOfNode;
exports.parseCommentDocValue = parseCommentDocValue;
exports.getTsDocTagsOfNode = getTsDocTagsOfNode;
exports.getTsDocErrorsOfNode = getTsDocErrorsOfNode;
exports.getDecoratorArguments = getDecoratorArguments;
exports.getDecoratorName = getDecoratorName;
exports.findNullableTypeFromUnion = findNullableTypeFromUnion;
exports.createBooleanLiteral = createBooleanLiteral;
exports.createPrimitiveLiteral = createPrimitiveLiteral;
exports.createLiteralFromAnyValue = createLiteralFromAnyValue;
const tsdoc_1 = require("@microsoft/tsdoc");
const typescript_1 = require("typescript");
const plugin_utils_1 = require("./plugin-utils");
function renderDocNode(docNode) {
    let result = '';
    if (docNode) {
        if (docNode instanceof tsdoc_1.DocExcerpt) {
            result += docNode.content.toString();
        }
        for (const childNode of docNode.getChildNodes()) {
            result += renderDocNode(childNode);
        }
    }
    return result;
}
function isArray(type) {
    const symbol = type.getSymbol();
    if (!symbol) {
        return false;
    }
    return symbol.getName() === 'Array' && getTypeArguments(type).length === 1;
}
function getTypeArguments(type) {
    return type.typeArguments || [];
}
function isBoolean(type) {
    return hasFlag(type, typescript_1.TypeFlags.Boolean);
}
function isString(type) {
    return hasFlag(type, typescript_1.TypeFlags.String);
}
function isStringLiteral(type) {
    return hasFlag(type, typescript_1.TypeFlags.StringLiteral) && !type.isUnion();
}
function isStringMapping(type) {
    return hasFlag(type, typescript_1.TypeFlags.StringMapping);
}
function isNumber(type) {
    return hasFlag(type, typescript_1.TypeFlags.Number);
}
function isBigInt(type) {
    return hasFlag(type, typescript_1.TypeFlags.BigInt);
}
function isInterface(type) {
    return hasObjectFlag(type, typescript_1.ObjectFlags.Interface);
}
function isEnum(type) {
    const hasEnumFlag = hasFlag(type, typescript_1.TypeFlags.Enum);
    if (hasEnumFlag) {
        return true;
    }
    if (isEnumLiteral(type)) {
        return false;
    }
    const symbol = type.getSymbol();
    if (!symbol) {
        return false;
    }
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
        return false;
    }
    return valueDeclaration.kind === typescript_1.SyntaxKind.EnumDeclaration;
}
function isEnumLiteral(type) {
    return hasFlag(type, typescript_1.TypeFlags.EnumLiteral) && !type.isUnion();
}
function hasFlag(type, flag) {
    return (type.flags & flag) === flag;
}
function hasObjectFlag(type, flag) {
    return (type.objectFlags & flag) === flag;
}
function getText(type, typeChecker, enclosingNode, typeFormatFlags) {
    if (!typeFormatFlags) {
        typeFormatFlags = getDefaultTypeFormatFlags(enclosingNode);
    }
    const compilerNode = !enclosingNode ? undefined : enclosingNode;
    return typeChecker.typeToString(type, compilerNode, typeFormatFlags);
}
function getDefaultTypeFormatFlags(enclosingNode) {
    let formatFlags = typescript_1.TypeFormatFlags.UseTypeOfFunction |
        typescript_1.TypeFormatFlags.NoTruncation |
        typescript_1.TypeFormatFlags.UseFullyQualifiedType |
        typescript_1.TypeFormatFlags.WriteTypeArgumentsOfSignature;
    if (enclosingNode && enclosingNode.kind === typescript_1.SyntaxKind.TypeAliasDeclaration)
        formatFlags |= typescript_1.TypeFormatFlags.InTypeAlias;
    return formatFlags;
}
function getDocComment(node) {
    const tsdocParser = new tsdoc_1.TSDocParser();
    const parserContext = tsdocParser.parseString(node.getFullText());
    return parserContext.docComment;
}
function getMainCommentOfNode(node) {
    const docComment = getDocComment(node);
    return renderDocNode(docComment.summarySection).trim();
}
function parseCommentDocValue(docValue, type) {
    let value = docValue.replace(/'/g, '"').trim();
    if (!type || !isString(type)) {
        try {
            value = JSON.parse(value);
        }
        catch (_a) {
        }
    }
    else if (isString(type)) {
        if (value.split(' ').length !== 1 && !value.startsWith('"')) {
            value = null;
        }
        else {
            value = value.replace(/"/g, '');
        }
    }
    return value;
}
function getTsDocTagsOfNode(node, typeChecker) {
    const docComment = getDocComment(node);
    const tagDefinitions = {
        example: {
            hasProperties: true,
            repeatable: true
        }
    };
    const tagResults = {};
    const introspectTsDocTags = (docComment) => {
        for (const tag in tagDefinitions) {
            const { hasProperties, repeatable } = tagDefinitions[tag];
            const blocks = docComment.customBlocks.filter((block) => block.blockTag.tagName === `@${tag}`);
            if (blocks.length === 0) {
                continue;
            }
            if (repeatable && !tagResults[tag]) {
                tagResults[tag] = [];
            }
            const type = typeChecker.getTypeAtLocation(node);
            if (hasProperties) {
                blocks.forEach((block) => {
                    const docValue = renderDocNode(block.content).split('\n')[0];
                    const value = parseCommentDocValue(docValue, type);
                    if (value !== null) {
                        if (repeatable) {
                            tagResults[tag].push(value);
                        }
                        else {
                            tagResults[tag] = value;
                        }
                    }
                });
            }
            else {
                tagResults[tag] = true;
            }
        }
        if (docComment.remarksBlock) {
            tagResults['remarks'] = renderDocNode(docComment.remarksBlock.content).trim();
        }
        if (docComment.deprecatedBlock) {
            tagResults['deprecated'] = true;
        }
    };
    introspectTsDocTags(docComment);
    return tagResults;
}
function getTsDocErrorsOfNode(node) {
    const tsdocParser = new tsdoc_1.TSDocParser();
    const parserContext = tsdocParser.parseString(node.getFullText());
    const docComment = parserContext.docComment;
    const tagResults = [];
    const errorParsingRegex = /{(\d+)} (.*)/;
    const introspectTsDocTags = (docComment) => {
        const blocks = docComment.customBlocks.filter((block) => block.blockTag.tagName === '@throws');
        blocks.forEach((block) => {
            try {
                const docValue = renderDocNode(block.content).split('\n')[0].trim();
                const match = docValue.match(errorParsingRegex);
                tagResults.push({
                    status: match[1],
                    description: `"${match[2]}"`
                });
            }
            catch (_a) {
            }
        });
    };
    introspectTsDocTags(docComment);
    return tagResults;
}
function getDecoratorArguments(decorator) {
    const callExpression = decorator.expression;
    return (callExpression && callExpression.arguments) || [];
}
function getDecoratorName(decorator) {
    const isDecoratorFactory = decorator.expression.kind === typescript_1.SyntaxKind.CallExpression;
    if (isDecoratorFactory) {
        const callExpression = decorator.expression;
        const identifier = callExpression
            .expression;
        if ((0, plugin_utils_1.isDynamicallyAdded)(identifier)) {
            return undefined;
        }
        return getIdentifierFromName(callExpression.expression).getText();
    }
    return getIdentifierFromName(decorator.expression).getText();
}
function getIdentifierFromName(expression) {
    const identifier = getNameFromExpression(expression);
    if (expression && expression.kind !== typescript_1.SyntaxKind.Identifier) {
        throw new Error();
    }
    return identifier;
}
function getNameFromExpression(expression) {
    if (expression && expression.kind === typescript_1.SyntaxKind.PropertyAccessExpression) {
        return expression.name;
    }
    return expression;
}
function findNullableTypeFromUnion(typeNode, typeChecker) {
    return typeNode.types.find((tNode) => hasFlag(typeChecker.getTypeAtLocation(tNode), typescript_1.TypeFlags.Null));
}
function createBooleanLiteral(factory, flag) {
    return flag ? factory.createTrue() : factory.createFalse();
}
function createPrimitiveLiteral(factory, item, typeOfItem = typeof item) {
    switch (typeOfItem) {
        case 'boolean':
            return createBooleanLiteral(factory, item);
        case 'number': {
            if (item < 0) {
                return factory.createPrefixUnaryExpression(typescript_1.SyntaxKind.MinusToken, factory.createNumericLiteral(Math.abs(item)));
            }
            return factory.createNumericLiteral(item);
        }
        case 'string':
            return factory.createStringLiteral(item);
    }
}
function createLiteralFromAnyValue(factory, item) {
    return Array.isArray(item)
        ? factory.createArrayLiteralExpression(item.map((item) => createLiteralFromAnyValue(factory, item)))
        : createPrimitiveLiteral(factory, item);
}

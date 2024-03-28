import * as ts from 'typescript';
import {
  CallExpression,
  CommentRange,
  Decorator,
  getLeadingCommentRanges,
  getTrailingCommentRanges,
  Identifier,
  LeftHandSideExpression,
  Node,
  ObjectFlags,
  ObjectType,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind,
  Type,
  TypeChecker,
  TypeFlags,
  TypeFormatFlags,
  TypeNode,
  UnionTypeNode
} from 'typescript';
import { isDynamicallyAdded } from './plugin-utils';
import {
  DocNode,
  DocExcerpt,
  TSDocParser,
  ParserContext,
  DocComment,
  DocBlock
} from '@microsoft/tsdoc';

export function renderDocNode(docNode: DocNode) {
  let result: string = '';
  if (docNode) {
    if (docNode instanceof DocExcerpt) {
      result += docNode.content.toString();
    }
    for (const childNode of docNode.getChildNodes()) {
      result += renderDocNode(childNode);
    }
  }
  return result;
}

export function isArray(type: Type) {
  const symbol = type.getSymbol();
  if (!symbol) {
    return false;
  }
  return symbol.getName() === 'Array' && getTypeArguments(type).length === 1;
}

export function getTypeArguments(type: Type) {
  return (type as any).typeArguments || [];
}

export function isBoolean(type: Type) {
  return hasFlag(type, TypeFlags.Boolean);
}

export function isString(type: Type) {
  return hasFlag(type, TypeFlags.String);
}

export function isStringLiteral(type: Type) {
  return hasFlag(type, TypeFlags.StringLiteral) && !type.isUnion();
}

export function isStringMapping(type: Type) {
  return hasFlag(type, TypeFlags.StringMapping);
}

export function isNumber(type: Type) {
  return hasFlag(type, TypeFlags.Number);
}

export function isBigInt(type: Type) {
  return hasFlag(type, TypeFlags.BigInt);
}

export function isInterface(type: Type) {
  return hasObjectFlag(type, ObjectFlags.Interface);
}

export function isEnum(type: Type) {
  const hasEnumFlag = hasFlag(type, TypeFlags.Enum);
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
  return valueDeclaration.kind === SyntaxKind.EnumDeclaration;
}

export function isEnumLiteral(type: Type) {
  return hasFlag(type, TypeFlags.EnumLiteral) && !type.isUnion();
}

export function hasFlag(type: Type, flag: TypeFlags) {
  return (type.flags & flag) === flag;
}

export function hasObjectFlag(type: Type, flag: ObjectFlags) {
  return ((type as ObjectType).objectFlags & flag) === flag;
}

export function getText(
  type: Type,
  typeChecker: TypeChecker,
  enclosingNode?: Node,
  typeFormatFlags?: TypeFormatFlags
) {
  if (!typeFormatFlags) {
    typeFormatFlags = getDefaultTypeFormatFlags(enclosingNode);
  }
  const compilerNode = !enclosingNode ? undefined : enclosingNode;
  return typeChecker.typeToString(type, compilerNode, typeFormatFlags);
}

export function getDefaultTypeFormatFlags(enclosingNode: Node) {
  let formatFlags =
    TypeFormatFlags.UseTypeOfFunction |
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.UseFullyQualifiedType |
    TypeFormatFlags.WriteTypeArgumentsOfSignature;
  if (enclosingNode && enclosingNode.kind === SyntaxKind.TypeAliasDeclaration)
    formatFlags |= TypeFormatFlags.InTypeAlias;
  return formatFlags;
}

export function getDocComment(node: Node): DocComment {
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(
    node.getFullText()
  );
  return parserContext.docComment;
}
export function getMainCommentOfNode(
  node: Node,
  sourceFile: SourceFile
): string {
  const docComment = getDocComment(node);
  return renderDocNode(docComment.summarySection).trim();
}

export function parseCommentDocValue(docValue: string, type: ts.Type) {
  let value = docValue.replace(/'/g, '"').trim();

  if (!type || !isString(type)) {
    try {
      value = JSON.parse(value);
    } catch {}
  } else if (isString(type)) {
    if (value.split(' ').length !== 1 && !value.startsWith('"')) {
      value = null;
    } else {
      value = value.replace(/"/g, '');
    }
  }
  return value;
}

export function getTsDocTagsOfNode(node: Node, typeChecker: TypeChecker) {
  const docComment = getDocComment(node);

  const tagDefinitions: {
    [key: string]: {
      hasProperties: boolean;
      repeatable: boolean;
    };
  } = {
    example: {
      hasProperties: true,
      repeatable: true
    }
  };

  const tagResults: any = {};

  const introspectTsDocTags = (docComment: DocComment) => {
    for (const tag in tagDefinitions) {
      const { hasProperties, repeatable } = tagDefinitions[tag];
      const blocks = docComment.customBlocks.filter(
        (block) => block.blockTag.tagName === `@${tag}`
      );
      if (blocks.length === 0) continue;
      if (repeatable && !tagResults[tag]) tagResults[tag] = [];
      const type = typeChecker.getTypeAtLocation(node);
      if (hasProperties) {
        blocks.forEach((block) => {
          const docValue = renderDocNode(block.content).split('\n')[0];
          const value = parseCommentDocValue(docValue, type);

          if (value !== null) {
            if (repeatable) {
              tagResults[tag].push(value);
            } else {
              tagResults[tag] = value;
            }
          }
        });
      } else {
        tagResults[tag] = true;
      }
    }
    if (docComment.remarksBlock) {
      tagResults['remarks'] = renderDocNode(
        docComment.remarksBlock.content
      ).trim();
    }
    if (docComment.deprecatedBlock) {
      tagResults['deprecated'] = true;
    }
  };
  introspectTsDocTags(docComment);

  return tagResults;
}

export function getTsDocErrorsOfNode(node: Node) {
  const tsdocParser: TSDocParser = new TSDocParser();
  const parserContext: ParserContext = tsdocParser.parseString(
    node.getFullText()
  );
  const docComment: DocComment = parserContext.docComment;

  const tagResults = [];
  const errorParsingRegex = /{(\d+)} (.*)/;

  const introspectTsDocTags = (docComment: DocComment) => {
    const blocks = docComment.customBlocks.filter(
      (block) => block.blockTag.tagName === '@throws'
    );

    blocks.forEach((block) => {
      try {
        const docValue = renderDocNode(block.content).split('\n')[0].trim();
        const match = docValue.match(errorParsingRegex);
        tagResults.push({
          status: match[1],
          description: `"${match[2]}"`
        });
      } catch (err) {}
    });
  };
  introspectTsDocTags(docComment);
  return tagResults;
}

export function getDecoratorArguments(decorator: Decorator) {
  const callExpression = decorator.expression;
  return (callExpression && (callExpression as CallExpression).arguments) || [];
}

export function getDecoratorName(decorator: Decorator) {
  const isDecoratorFactory =
    decorator.expression.kind === SyntaxKind.CallExpression;
  if (isDecoratorFactory) {
    const callExpression = decorator.expression;
    const identifier = (callExpression as CallExpression)
      .expression as Identifier;
    if (isDynamicallyAdded(identifier)) {
      return undefined;
    }
    return getIdentifierFromName(
      (callExpression as CallExpression).expression
    ).getText();
  }
  return getIdentifierFromName(decorator.expression).getText();
}

function getIdentifierFromName(expression: LeftHandSideExpression) {
  const identifier = getNameFromExpression(expression);
  if (expression && expression.kind !== SyntaxKind.Identifier) {
    throw new Error();
  }
  return identifier;
}

function getNameFromExpression(expression: LeftHandSideExpression) {
  if (expression && expression.kind === SyntaxKind.PropertyAccessExpression) {
    return (expression as PropertyAccessExpression).name;
  }
  return expression;
}

export function findNullableTypeFromUnion(
  typeNode: UnionTypeNode,
  typeChecker: TypeChecker
) {
  return typeNode.types.find((tNode: TypeNode) =>
    hasFlag(typeChecker.getTypeAtLocation(tNode), TypeFlags.Null)
  );
}

export function createBooleanLiteral(
  factory: ts.NodeFactory,
  flag: boolean
): ts.BooleanLiteral {
  return flag ? factory.createTrue() : factory.createFalse();
}

export function createPrimitiveLiteral(
  factory: ts.NodeFactory,
  item: unknown,
  typeOfItem = typeof item
) {
  switch (typeOfItem) {
    case 'boolean':
      return createBooleanLiteral(factory, item as boolean);
    case 'number': {
      if ((item as number) < 0) {
        return factory.createPrefixUnaryExpression(
          SyntaxKind.MinusToken,
          factory.createNumericLiteral(Math.abs(item as number))
        );
      }
      return factory.createNumericLiteral(item as number);
    }
    case 'string':
      return factory.createStringLiteral(item as string);
  }
}

export function createLiteralFromAnyValue(
  factory: ts.NodeFactory,
  item: unknown
) {
  return Array.isArray(item)
    ? factory.createArrayLiteralExpression(
        item.map((item) => createLiteralFromAnyValue(factory, item))
      )
    : createPrimitiveLiteral(factory, item);
}

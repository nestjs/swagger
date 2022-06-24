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

export function getMainCommentAndExamplesOfNode(
  node: Node,
  sourceFile: SourceFile,
  typeChecker: TypeChecker,
  includeExamples?: boolean
): [string, string[]] {
  const sourceText = sourceFile.getFullText();
  // in case we decide to include "// comments"
  const replaceRegex =
    /^\s*\** *@.*$|^\s*\/\*+ *|^\s*\/\/+.*|^\s*\/+ *|^\s*\*+ *| +$| *\**\/ *$/gim;
  //const replaceRegex = /^ *\** *@.*$|^ *\/\*+ *|^ *\/+ *|^ *\*+ *| +$| *\**\/ *$/gim;

  const commentResult = [];
  const examplesResult = [];
  const introspectCommentsAndExamples = (comments?: CommentRange[]) =>
    comments?.forEach((comment) => {
      const commentSource = sourceText.substring(comment.pos, comment.end);
      const oneComment = commentSource.replace(replaceRegex, '').trim();
      if (oneComment) {
        commentResult.push(oneComment);
      }
      if (includeExamples) {
        const regexOfExample =
          /@example *((['"](?<exampleAsString>.+?)['"])|(?<exampleAsBooleanOrNumber>[^ ]+?)|(?<exampleAsArray>(\[.+?\]))) *$/gim;
        let execResult: RegExpExecArray;
        while (
          (execResult = regexOfExample.exec(commentSource)) &&
          execResult.length > 1
        ) {
          const example =
            execResult.groups?.exampleAsString ??
            execResult.groups?.exampleAsBooleanOrNumber ??
            (execResult.groups?.exampleAsArray &&
              execResult.groups.exampleAsArray.replace(/'/g, '"'));

          const type = typeChecker.getTypeAtLocation(node);
          if (type && isString(type)) {
            examplesResult.push(example);
          } else {
            try {
              examplesResult.push(JSON.parse(example));
            } catch {
              examplesResult.push(example);
            }
          }
        }
      }
    });

  const leadingCommentRanges = getLeadingCommentRanges(
    sourceText,
    node.getFullStart()
  );
  introspectCommentsAndExamples(leadingCommentRanges);
  if (!commentResult.length) {
    const trailingCommentRanges = getTrailingCommentRanges(
      sourceText,
      node.getFullStart()
    );
    introspectCommentsAndExamples(trailingCommentRanges);
  }
  return [commentResult.join('\n'), examplesResult];
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

export function createPrimitiveLiteral(factory: ts.NodeFactory, item: unknown) {
  const typeOfItem = typeof item;

  switch (typeOfItem) {
    case 'boolean':
      return createBooleanLiteral(factory, item as boolean);
    case 'number':
      return factory.createNumericLiteral(item as number);
    case 'string':
      return factory.createStringLiteral(item as string);
  }
}

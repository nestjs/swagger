import { head } from 'lodash';
import { dirname, posix } from 'path';
import * as ts from 'typescript';
import {
  getDecoratorName,
  getText,
  getTypeArguments,
  isArray,
  isBoolean,
  isEnum,
  isInterface,
  isNumber,
  isString
} from './ast-utils';

export function getDecoratorOrUndefinedByNames(
  names: string[],
  decorators: ts.NodeArray<ts.Decorator>
): ts.Decorator | undefined {
  return (decorators || ts.createNodeArray()).find(item =>
    names.includes(getDecoratorName(item))
  );
}

export function getTypeReferenceAsString(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): string {
  if (isArray(type)) {
    const arrayType = getTypeArguments(type)[0];
    const elementType = getTypeReferenceAsString(arrayType, typeChecker);
    if (!elementType) {
      return `undefined`;
    }
    return `[${elementType}]`;
  }
  if (isBoolean(type)) {
    return Boolean.name;
  }
  if (isNumber(type)) {
    return Number.name;
  }
  if (isString(type)) {
    return String.name;
  }
  if (isPromiseOrObservable(getText(type, typeChecker))) {
    const typeArguments = getTypeArguments(type);
    const elementType = getTypeReferenceAsString(
      head(typeArguments),
      typeChecker
    );
    if (!elementType) {
      return undefined;
    }
    return elementType;
  }
  if (type.isClass()) {
    return getText(type, typeChecker);
  }
  try {
    const text = getText(type, typeChecker);
    if (text === Date.name) {
      return text;
    }
    if (
      text === 'any' ||
      text === 'unknown' ||
      text === 'object' ||
      isInterface(type)
    ) {
      return 'Object';
    }
    if (isEnum(type)) {
      return undefined;
    }
    if (type.aliasSymbol) {
      return 'Object';
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function isPromiseOrObservable(type: string) {
  return type.includes('Promise') || type.includes('Observable');
}

export function hasPropertyKey(
  key: string,
  properties: ts.NodeArray<ts.PropertyAssignment>
): boolean {
  return properties
    .filter(item => !isDynamicallyAdded(item))
    .some(item => item.name.getText() === key);
}

export function replaceImportPath(typeReference: string, fileName: string) {
  if (!typeReference.includes('import')) {
    return typeReference;
  }
  let importPath = /\(\"([^)]).+(\")/.exec(typeReference)[0];
  if (!importPath) {
    return undefined;
  }
  importPath = importPath.slice(2, importPath.length - 1);

  let relativePath = posix.relative(dirname(fileName), importPath);
  relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;

  const nodeModulesText = 'node_modules';
  const nodeModulePos = relativePath.indexOf(nodeModulesText);
  if (nodeModulePos >= 0) {
    relativePath = relativePath.slice(
      nodeModulePos + nodeModulesText.length + 1 // slash
    );

    const typesText = '@types';
    const typesPos = relativePath.indexOf(typesText);
    if (typesPos >= 0) {
      relativePath = relativePath.slice(
        typesPos + typesText.length + 1 //slash
      );
    }

    const indexText = '/index';
    const indexPos = relativePath.indexOf(indexText);
    if (indexPos >= 0) {
      relativePath = relativePath.slice(indexPos + indexText.length);
    }
  }

  typeReference = typeReference.replace(importPath, relativePath);
  return typeReference.replace('import', 'require');
}

export function isDynamicallyAdded(identifier: ts.Node) {
  return identifier && !identifier.parent && identifier.pos === -1;
}

import { head } from 'lodash';
import { dirname, posix } from 'path';
import * as ts from 'typescript';
import {
  getDecoratorName,
  getText,
  getTypeArguments,
  isArray,
  isBoolean,
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
      return undefined;
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
    return text === Date.name ? text : undefined;
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
  typeReference = typeReference.replace(importPath, relativePath);

  return typeReference.replace('import', 'require');
}

export function isDynamicallyAdded(identifier: ts.Node) {
  return identifier && !identifier.parent && identifier.pos === -1;
}

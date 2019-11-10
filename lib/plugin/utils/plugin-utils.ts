import { head } from 'lodash';
import { Decorator, Node, Type } from 'ts-morph';
import * as ts from 'typescript';

export function getDecoratorOrUndefinedByNames(
  names: string[],
  decorators: Decorator[]
): Decorator | undefined {
  return decorators.find(item => names.includes(item.getName()));
}

export function getTypeReferenceAsString(type: Type, node: Node): string {
  if (type.isArray()) {
    const arrayType = type.getArrayElementType();
    const elementType = this.getTypeReferenceAsString(arrayType, node);
    if (!elementType) {
      return undefined;
    }
    return `[${elementType}]`;
  }
  if (type.isBoolean()) {
    return Boolean.name;
  }
  if (type.isNumber()) {
    return Number.name;
  }
  if (type.isString()) {
    return String.name;
  }
  if (isPromiseOrObservable(type.getText())) {
    const typeArguments = type.getTypeArguments();
    const elementType = this.getTypeReferenceAsString(
      head(typeArguments),
      node
    );
    if (!elementType) {
      return undefined;
    }
    return elementType;
  }
  if (type.isClass()) {
    return type.getText(node);
  }
  return undefined;
}

export function isPromiseOrObservable(type: string) {
  return type.includes('Promise') || type.includes('Observable');
}

export function hasPropertyKey(
  key: string,
  properties: ts.PropertyAssignment[]
): boolean {
  return properties.some(item => item.name.getText() === key);
}

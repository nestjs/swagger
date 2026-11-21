import { Type } from '@nestjs/common';
import isFunction from 'es-toolkit/compat/isFunction';
import { BUILT_IN_TYPES } from '../services/constants.js';

const PRIMITIVE_TYPE_NAMES = ['string', 'number', 'integer', 'boolean'];

export function isBuiltInType(
  type: Type<unknown> | Function | string
): boolean {
  return isFunction(type) && BUILT_IN_TYPES.some((item) => item === type);
}

export function isPrimitiveTypeName(type: unknown): boolean {
  return PRIMITIVE_TYPE_NAMES.includes(type as string);
}

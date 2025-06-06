import { Type } from '@nestjs/common';
import { isFunction } from 'es-toolkit/compat';
import { BUILT_IN_TYPES } from '../services/constants';

export function isBuiltInType(
  type: Type<unknown> | Function | string
): boolean {
  return isFunction(type) && BUILT_IN_TYPES.some((item) => item === type);
}

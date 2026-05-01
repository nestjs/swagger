import lodash from 'lodash';
import { Type } from '@nestjs/common';
const { isFunction } = lodash;
import { BUILT_IN_TYPES } from '../services/constants.js';

export function isBuiltInType(
  type: Type<unknown> | Function | string
): boolean {
  return isFunction(type) && BUILT_IN_TYPES.some((item) => item === type);
}

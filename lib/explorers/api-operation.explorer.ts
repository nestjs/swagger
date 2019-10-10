import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreApiOperationMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_OPERATION, method);

import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreApiIncludeEndpointMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_INCLUDE_ENDPOINT, method);

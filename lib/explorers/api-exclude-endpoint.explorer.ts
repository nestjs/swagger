import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreApiExcludeEndpointMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_EXCLUDE_ENDPOINT, method);

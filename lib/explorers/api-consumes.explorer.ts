import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiConsumesMetadata = (metatype: Type<unknown>) => {
  const consumes = Reflect.getMetadata(DECORATORS.API_CONSUMES, metatype);
  return consumes ? { consumes } : undefined;
};

export const exploreApiConsumesMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
): string[] | undefined => Reflect.getMetadata(DECORATORS.API_CONSUMES, method);

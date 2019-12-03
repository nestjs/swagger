import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiProducesMetadata = (metatype: Type<unknown>) => {
  const produces = Reflect.getMetadata(DECORATORS.API_PRODUCES, metatype);
  return produces ? { produces } : undefined;
};

export const exploreApiProducesMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_PRODUCES, method);

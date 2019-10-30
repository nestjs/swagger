import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiSecurityMetadata = (metatype: Type<unknown>) => {
  const security = Reflect.getMetadata(DECORATORS.API_SECURITY, metatype);
  return security ? { security } : undefined;
};

export const exploreApiSecurityMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => {
  return Reflect.getMetadata(DECORATORS.API_SECURITY, method);
};

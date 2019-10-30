import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiHeaderMetadata = (metatype: Type<unknown>) => {
  const headers = Reflect.getMetadata(DECORATORS.API_HEADERS, metatype);
  return headers ? { root: { parameters: headers }, depth: 1 } : undefined;
};

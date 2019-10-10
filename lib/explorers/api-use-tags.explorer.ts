import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiUseTagsMetadata = (metatype: Type<unknown>) => {
  const tags = Reflect.getMetadata(DECORATORS.API_USE_TAGS, metatype);
  return tags ? { tags } : undefined;
};

export const exploreApiUseTagsMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_USE_TAGS, method);

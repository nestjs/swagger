import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiTagsMetadata = (metatype: Type<unknown>) => {
  const tags = Reflect.getMetadata(DECORATORS.API_TAGS, metatype);
  return tags ? { tags } : undefined;
};

export const exploreApiTagsMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_TAGS, method);

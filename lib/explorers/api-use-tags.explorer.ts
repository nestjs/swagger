import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiTagsMetadata = (includeControllerTag?: boolean) => (metatype: Type<unknown>) => {
  const controllerTags: string[] = (includeControllerTag === true) ? [metatype.name] : []
  const decoratorTags = Reflect.getMetadata(DECORATORS.API_TAGS, metatype);
  const tags = controllerTags.concat(decoratorTags).filter(ele => ele !== undefined)
  return tags.length > 0 ? { tags } : undefined;
};

export const exploreApiTagsMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_TAGS, method);

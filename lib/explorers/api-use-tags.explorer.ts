import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiTagsMetadata =
  (autoTagControllers?: boolean) => (metatype: Type<unknown>) => {
    const decoratorTags = Reflect.getMetadata(DECORATORS.API_TAGS, metatype);
    const isEmpty = !decoratorTags || decoratorTags.length === 0;
    if (isEmpty && autoTagControllers) {
      // When there are no tags defined in the controller
      // use the controller name without the suffix `Controller`
      // as the default tag

      const defaultTag = metatype.name.replace(/Controller$/, '');
      return {
        tags: [defaultTag]
      };
    }
    return isEmpty ? undefined : { tags: decoratorTags };
  };

export const exploreApiTagsMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
) => Reflect.getMetadata(DECORATORS.API_TAGS, method);

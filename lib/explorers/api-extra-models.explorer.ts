import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';

export const exploreGlobalApiExtraModelsMetadata = (
  metatype: Type<unknown>
): Function[] => {
  const extraModels = Reflect.getMetadata(
    DECORATORS.API_EXTRA_MODELS,
    metatype
  );
  return extraModels || [];
};

export const exploreApiExtraModelsMetadata = (
  instance: object,
  prototype: Type<unknown>,
  method: object
): Function[] => Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, method) || [];

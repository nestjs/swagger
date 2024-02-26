import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { flatMap, identity } from 'lodash';
import { DECORATORS } from '../constants';
import { isBodyParameter } from '../utils/is-body-parameter.util';
import { ModelPropertiesAccessor } from './model-properties-accessor';
import {
  ParamWithTypeMetadata,
  ParamsWithType
} from './parameter-metadata-accessor';

export class ParametersMetadataMapper {
  constructor(
    private readonly modelPropertiesAccessor: ModelPropertiesAccessor
  ) {}

  transformModelToProperties(
    parameters: ParamsWithType
  ): ParamWithTypeMetadata[] {
    const properties = flatMap(parameters, (param: ParamWithTypeMetadata) => {
      if (!param || param.type === Object || !param.type) {
        return undefined;
      }
      if (param.name) {
        // when "name" is present, the "data" argument was passed to the decorator
        // e.g. `@Query('param')
        return param;
      }
      if (isBodyParameter(param)) {
        const isCtor = param.type && isFunction(param.type);
        const name = isCtor ? param.type.name : param.type;
        return { ...param, name };
      }
      const { prototype } = param.type;

      this.modelPropertiesAccessor.applyMetadataFactory(prototype);
      const modelProperties =
        this.modelPropertiesAccessor.getModelProperties(prototype);

      return modelProperties.map((key) =>
        this.mergeImplicitWithExplicit(key, prototype, param)
      );
    });
    return properties.filter(identity);
  }

  mergeImplicitWithExplicit(
    key: string,
    prototype: Type<unknown>,
    param: ParamWithTypeMetadata
  ): ParamWithTypeMetadata {
    const reflectedParam =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
      {};

    return {
      ...param,
      ...reflectedParam,
      name: reflectedParam.name || key
    };
  }
}

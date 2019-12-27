import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';

export class ModelPropertiesAccessor {
  getModelProperties(prototype: Type<unknown>): string[] {
    const properties =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) ||
      [];

    return properties
      .filter(isString)
      .filter(
        (key: string) => key.charAt(0) === ':' && !isFunction(prototype[key])
      )
      .map((key: string) => key.slice(1));
  }

  applyMetadataFactory(prototype: Type<unknown>) {
    if (!prototype.constructor) {
      return;
    }
    if (!prototype.constructor[METADATA_FACTORY_NAME]) {
      return;
    }
    const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
    const properties = Object.keys(metadata);
    properties.forEach(key => {
      ApiProperty(metadata[key])(prototype, key);
    });
  }
}

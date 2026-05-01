import lodash from 'lodash';
import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
const { pick } = lodash;
import { DECORATORS } from '../constants.js';
import { ApiProperty } from '../decorators/index.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import { clonePluginMetadataFactory } from './mapped-types.utils.js';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

/**
 * @publicApi
 */
export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[]
): Type<Pick<T, (typeof keys)[number]>> {
  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter((item) => keys.includes(item as K));

  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);

  abstract class PickTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }

  inheritValidationMetadata(classRef, PickTypeClass, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickTypeClass, isInheritedPredicate);

  function applyFields(fields: string[]) {
    clonePluginMetadataFactory(
      PickTypeClass as Type<unknown>,
      classRef.prototype,
      (metadata: Record<string, any>) => pick(metadata, keys)
    );

    fields.forEach((propertyKey) => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        classRef.prototype,
        propertyKey
      );
      const decoratorFactory = ApiProperty(metadata);
      decoratorFactory(PickTypeClass.prototype, propertyKey);
    });

    if (PickTypeClass[METADATA_FACTORY_NAME]) {
      const pluginMetadata = PickTypeClass[METADATA_FACTORY_NAME]();
      Object.keys(pluginMetadata).forEach((key) => {
        if (!fields.includes(key)) {
          const decoratorFactory = ApiProperty(pluginMetadata[key]);
          decoratorFactory(PickTypeClass.prototype, key);
        }
      });
    }
  }
  applyFields(fields);

  MetadataLoader.addRefreshHook(() => {
    const fields = modelPropertiesAccessor
      .getModelProperties(classRef.prototype)
      .filter((item) => keys.includes(item as K));

    applyFields(fields);
  });

  return PickTypeClass as Type<Pick<T, (typeof keys)[number]>>;
}

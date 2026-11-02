import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import pick from 'es-toolkit/compat/pick';
import { DECORATORS } from '../constants.js';
import { ApiProperty } from '../decorators/index.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import {
  clonePluginMetadataFactory,
  setMappedTypeClassName
} from './mapped-types.utils.js';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

/**
 * @publicApi
 */
export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[]
): Type<Pick<T, (typeof keys)[number]>> {
  // Property metadata is registered under string keys, whereas "keyof T"
  // is a number for a numeric property (e.g. a numeric enum member)
  const pickedKeys = keys.map((key) =>
    typeof key === 'number' ? String(key) : key
  );
  const isInheritedPredicate = (propertyKey: string) =>
    pickedKeys.includes(propertyKey);

  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter(isInheritedPredicate);

  abstract class PickTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }
  setMappedTypeClassName(PickTypeClass, 'Pick', classRef, keys);

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
      .filter(isInheritedPredicate);

    applyFields(fields);
  });

  return PickTypeClass as Type<Pick<T, (typeof keys)[number]>>;
}

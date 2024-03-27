import { Type } from '@nestjs/common';
import {
  applyIsOptionalDecorator,
  applyValidateIfDefinedDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { mapValues } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { MetadataLoader } from '../plugin/metadata-loader';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function PartialType<T>(
  classRef: Type<T>,
  /**
   *  Configuration options.
   */
  options: {
    /**
     * If true, validations will be ignored on a property if it is either null or undefined. If
     * false, validations will be ignored only if the property is undefined.
     * @default true
     */
    skipNullProperties?: boolean;
  } = {}
): Type<Partial<T>> {
  const applyPartialDecoratorFn =
    options.skipNullProperties === false
      ? applyValidateIfDefinedDecorator
      : applyIsOptionalDecorator;

  const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);

  abstract class PartialTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }
  const keysWithValidationConstraints = inheritValidationMetadata(
    classRef,
    PartialTypeClass
  );
  if (keysWithValidationConstraints) {
    keysWithValidationConstraints
      .filter((key) => !fields.includes(key))
      .forEach((key) => applyPartialDecoratorFn(PartialTypeClass, key));
  }

  inheritTransformationMetadata(classRef, PartialTypeClass);

  function applyFields(fields: string[]) {
    clonePluginMetadataFactory(
      PartialTypeClass as Type<unknown>,
      classRef.prototype,
      (metadata: Record<string, any>) =>
        mapValues(metadata, (item) => ({ ...item, required: false }))
    );

    if (PartialTypeClass[METADATA_FACTORY_NAME]) {
      const pluginFields = Object.keys(
        PartialTypeClass[METADATA_FACTORY_NAME]()
      );
      pluginFields.forEach((key) =>
        applyPartialDecoratorFn(PartialTypeClass, key)
      );
    }

    fields.forEach((key) => {
      const metadata =
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          classRef.prototype,
          key
        ) || {};

      const decoratorFactory = ApiProperty({
        ...metadata,
        required: false
      });
      decoratorFactory(PartialTypeClass.prototype, key);
      applyPartialDecoratorFn(PartialTypeClass, key);
    });
  }
  applyFields(fields);

  MetadataLoader.addRefreshHook(() => {
    const fields = modelPropertiesAccessor.getModelProperties(
      classRef.prototype
    );
    applyFields(fields);
  });

  return PartialTypeClass as Type<Partial<T>>;
}

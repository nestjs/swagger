import { Type } from '@nestjs/common';
import {
  applyIsOptionalDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { mapValues } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function PartialType<T>(classRef: Type<T>): Type<Partial<T>> {
  const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);

  abstract class PartialTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }
  inheritValidationMetadata(classRef, PartialTypeClass);
  inheritTransformationMetadata(classRef, PartialTypeClass);

  clonePluginMetadataFactory(
    PartialTypeClass as Type<unknown>,
    classRef.prototype,
    (metadata: Record<string, any>) =>
      mapValues(metadata, (item) => ({ ...item, required: false }))
  );

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
    applyIsOptionalDecorator(PartialTypeClass, key);
  });

  if (PartialTypeClass[METADATA_FACTORY_NAME]) {
    const pluginFields = Object.keys(PartialTypeClass[METADATA_FACTORY_NAME]());
    pluginFields.forEach((key) =>
      applyIsOptionalDecorator(PartialTypeClass, key)
    );
  }

  return PartialTypeClass as Type<Partial<T>>;
}

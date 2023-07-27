import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { pick } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { MetadataLoader } from '../plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

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

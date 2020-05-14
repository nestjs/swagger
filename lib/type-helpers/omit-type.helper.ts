import { Type } from '@nestjs/common';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { omit } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[]
): Type<Omit<T, typeof keys[number]>> {
  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter((item) => !keys.includes(item as K));

  abstract class OmitTypeClass {}

  const isInheritedPredicate = (propertyKey: string) =>
    !keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, OmitTypeClass, isInheritedPredicate);
  inheritTransformationMetadata(classRef, OmitTypeClass, isInheritedPredicate);

  clonePluginMetadataFactory(
    OmitTypeClass as Type<unknown>,
    classRef.prototype,
    (metadata: Record<string, any>) => omit(metadata, keys)
  );

  fields.forEach((propertyKey) => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classRef.prototype,
      propertyKey
    );
    const decoratorFactory = ApiProperty(metadata);
    decoratorFactory(OmitTypeClass.prototype, propertyKey);
  });
  return OmitTypeClass as Type<Omit<T, typeof keys[number]>>;
}

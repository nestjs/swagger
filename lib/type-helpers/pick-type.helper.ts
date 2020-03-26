import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata
} from './type-helpers.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[]
): Type<Pick<T, typeof keys[number]>> {
  const fields = modelPropertiesAccessor
    .getModelProperties(classRef.prototype)
    .filter((item) => keys.includes(item as K));

  abstract class PickTypeClass {}

  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, PickTypeClass, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickTypeClass, isInheritedPredicate);

  fields.forEach((propertyKey) => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classRef.prototype,
      propertyKey
    );
    const decoratorFactory = ApiProperty(metadata);
    decoratorFactory(PickTypeClass.prototype, propertyKey);
  });

  return PickTypeClass as Type<Pick<T, typeof keys[number]>>;
}

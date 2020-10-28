import { Type } from '@nestjs/common';
import {
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';
import { inheritPropertyInitializers } from '@nestjs/mapped-types/dist/type-helpers.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>
): Type<A & B> {
  const fieldsOfA = modelPropertiesAccessor.getModelProperties(
    classARef.prototype
  );
  const fieldsOfB = modelPropertiesAccessor.getModelProperties(
    classBRef.prototype
  );

  abstract class IntersectionTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classARef);
      inheritPropertyInitializers(this, classBRef);
    }
  }
  inheritValidationMetadata(classARef, IntersectionTypeClass);
  inheritTransformationMetadata(classARef, IntersectionTypeClass);
  inheritValidationMetadata(classBRef, IntersectionTypeClass);
  inheritTransformationMetadata(classBRef, IntersectionTypeClass);

  clonePluginMetadataFactory(
    IntersectionTypeClass as Type<unknown>,
    classARef.prototype
  );
  clonePluginMetadataFactory(
    IntersectionTypeClass as Type<unknown>,
    classBRef.prototype
  );

  fieldsOfA.forEach((propertyKey) => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classARef.prototype,
      propertyKey
    );
    const decoratorFactory = ApiProperty(metadata);
    decoratorFactory(IntersectionTypeClass.prototype, propertyKey);
  });

  fieldsOfB.forEach((propertyKey) => {
    const metadata = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      classBRef.prototype,
      propertyKey
    );
    const decoratorFactory = ApiProperty(metadata);
    decoratorFactory(IntersectionTypeClass.prototype, propertyKey);
  });

  Object.defineProperty(IntersectionTypeClass, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`
  });
  return IntersectionTypeClass as Type<A & B>;
}

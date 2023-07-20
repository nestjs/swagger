import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { DECORATORS } from '../constants';
import { ApiProperty } from '../decorators';
import { MetadataLoader } from '../plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { clonePluginMetadataFactory } from './mapped-types.utils';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type ClassRefsToConstructors<T extends Type[]> = {
  [U in keyof T]: T[U] extends Type<infer V> ? V : never;
};

type Intersection<T extends Type[]> = Type<
  UnionToIntersection<ClassRefsToConstructors<T>[number]>
>;

export function IntersectionType<T extends Type[]>(...classRefs: T) {
  abstract class IntersectionClassType {
    constructor() {
      classRefs.forEach((classRef) => {
        inheritPropertyInitializers(this, classRef);
      });
    }
  }

  classRefs.forEach((classRef) => {
    const fields = modelPropertiesAccessor.getModelProperties(
      classRef.prototype
    );

    inheritValidationMetadata(classRef, IntersectionClassType);
    inheritTransformationMetadata(classRef, IntersectionClassType);

    function applyFields(fields: string[]) {
      clonePluginMetadataFactory(
        IntersectionClassType as Type<unknown>,
        classRef.prototype
      );

      fields.forEach((propertyKey) => {
        const metadata = Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          classRef.prototype,
          propertyKey
        );
        const decoratorFactory = ApiProperty(metadata);
        decoratorFactory(IntersectionClassType.prototype, propertyKey);
      });
    }
    applyFields(fields);

    MetadataLoader.addRefreshHook(() => {
      const fields = modelPropertiesAccessor.getModelProperties(
        classRef.prototype
      );
      applyFields(fields);
    });
  });

  const intersectedNames = classRefs.reduce((prev, ref) => prev + ref.name, '');
  Object.defineProperty(IntersectionClassType, 'name', {
    value: `Intersection${intersectedNames}`
  });
  return IntersectionClassType as Intersection<T>;
}

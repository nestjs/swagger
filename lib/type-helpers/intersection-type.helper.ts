import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { DECORATORS } from '../constants.js';
import { ApiProperty } from '../decorators/index.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import {
  clonePluginMetadataFactory,
  inheritExplicitApiPropertyOptions
} from './mapped-types.utils.js';

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

/**
 * @publicApi
 */
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
    inheritTransformationMetadata(
      classRef,
      IntersectionClassType,
      undefined,
      false
    );

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
        inheritExplicitApiPropertyOptions(
          classRef.prototype,
          IntersectionClassType.prototype,
          propertyKey
        );
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

  // Resolved on access, as the name of a mapped type can change once plugin
  // metadata has been loaded
  Object.defineProperty(IntersectionClassType, 'name', {
    configurable: true,
    get: () =>
      `Intersection${classRefs.reduce((prev, ref) => prev + ref.name, '')}`
  });
  return IntersectionClassType as Intersection<T>;
}

import { Type } from '@nestjs/common';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
import { DECORATORS } from '../constants.js';
import { createApiPropertyDecorator } from '../decorators/api-property.decorator.js';
import { ApiProperty } from '../decorators/index.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
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
 * Checks whether a decorator documents the property on the class or one of its
 * ancestors (CLI plugin metadata applied to them records no options).
 */
function isDecorated(prototype: object, propertyKey: string): boolean {
  for (
    let current = prototype;
    current && current !== Object.prototype;
    current = Reflect.getPrototypeOf(current)
  ) {
    if (
      Reflect.hasOwnMetadata(
        DECORATORS.API_MODEL_PROPERTY_EXPLICIT_OPTIONS,
        current,
        propertyKey
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the CLI plugin metadata that a class and its ancestors declare,
 * without the properties hidden from the class.
 */
function getPluginMetadata(classRef: Type): Record<string, any> {
  class PluginMetadataHolder {}
  clonePluginMetadataFactory(
    PluginMetadataHolder as Type<unknown>,
    classRef.prototype
  );
  return PluginMetadataHolder[METADATA_FACTORY_NAME]?.() ?? {};
}

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

  /**
   * Metadata on the prototype takes priority over plugin metadata, so a class
   * that declares a property through CLI plugin metadata alone would not
   * replace what an earlier class of the intersection documented for it. As
   * for a re-declaration in a subclass, its metadata replaces the type of the
   * earlier entry, and options set there with a decorator still apply.
   * Returns false when no earlier class documented the property.
   */
  function replaceType(
    propertyKey: string,
    metadata: Record<string, any> | undefined
  ): boolean {
    const prototype = IntersectionClassType.prototype;
    if (
      !metadata ||
      !Reflect.hasOwnMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        prototype,
        propertyKey
      )
    ) {
      return false;
    }
    const decoratedOptions =
      modelPropertiesAccessor.getDecoratedOptions(prototype, propertyKey) ?? {};
    Reflect.deleteMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      prototype,
      propertyKey
    );
    createApiPropertyDecorator({ ...metadata, ...decoratedOptions }, false)(
      prototype,
      propertyKey
    );
    Reflect.defineMetadata(
      DECORATORS.API_MODEL_PROPERTY_EXPLICIT_OPTIONS,
      Object.keys(decoratedOptions),
      prototype,
      propertyKey
    );
    return true;
  }

  classRefs.forEach((classRef) => {
    const fields = modelPropertiesAccessor.getModelProperties(
      classRef.prototype
    );

    inheritValidationMetadata(classRef, IntersectionClassType);
    // Flatten the prototype chain of classRef first, so that only the classes
    // of the intersection replace one another
    class InheritedClassType {}
    inheritTransformationMetadata(classRef, InheritedClassType);
    inheritTransformationMetadata(
      InheritedClassType,
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
        const metadata = modelPropertiesAccessor.getPropertyMetadata(
          classRef.prototype,
          propertyKey
        );
        if (
          !isDecorated(classRef.prototype, propertyKey) &&
          replaceType(propertyKey, metadata)
        ) {
          return;
        }
        const decoratorFactory = ApiProperty(metadata);
        decoratorFactory(IntersectionClassType.prototype, propertyKey);
        inheritExplicitApiPropertyOptions(
          classRef.prototype,
          IntersectionClassType.prototype,
          propertyKey
        );
      });

      const pluginMetadata = getPluginMetadata(classRef);
      Object.keys(pluginMetadata)
        .filter((propertyKey) => !fields.includes(propertyKey))
        .forEach((propertyKey) =>
          replaceType(propertyKey, pluginMetadata[propertyKey])
        );
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

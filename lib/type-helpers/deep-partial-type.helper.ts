import lodash from 'lodash';
import { Type } from '@nestjs/common';
import {
  applyIsOptionalDecorator,
  applyValidateIfDefinedDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata
} from '@nestjs/mapped-types';
const { mapValues } = lodash;
import { DECORATORS } from '../constants.js';
import { ApiProperty } from '../decorators/index.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';
import { clonePluginMetadataFactory } from './mapped-types.utils.js';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

/** Cache to avoid infinite recursion on circular types */
const deepPartialCache = new Map<Type<unknown>, Type<unknown>>();

/**
 * Returns true when `typeRef` is a class whose prototype carries swagger
 * model-property metadata — i.e. it is a DTO class, not a primitive
 * constructor like String, Number, Boolean, etc.
 */
function isDtoClass(typeRef: unknown): typeRef is Type<unknown> {
  if (
    !typeRef ||
    typeof typeRef !== 'function' ||
    typeRef === String ||
    typeRef === Number ||
    typeRef === Boolean ||
    typeRef === Object ||
    typeRef === Array ||
    typeRef === Date
  ) {
    return false;
  }
  const fields = modelPropertiesAccessor.getModelProperties(
    (typeRef as Type<unknown>).prototype
  );
  return fields.length > 0;
}

/**
 * Recursively makes all properties of a DTO class — and all nested DTO classes
 * referenced by its properties — optional.
 *
 * Identical to `PartialType` for flat DTOs; the difference is that properties
 * whose type is itself a DTO class are automatically wrapped in `DeepPartialType`
 * rather than keeping the original (fully-required) nested type.
 *
 * @publicApi
 */
export function DeepPartialType<T>(
  classRef: Type<T>,
  options: {
    /**
     * If true, validations will be ignored on a property if it is either null
     * or undefined. If false, validations will be ignored only if the property
     * is undefined.
     * @default true
     */
    skipNullProperties?: boolean;
  } = {}
): Type<DeepPartial<T>> {
  if (deepPartialCache.has(classRef)) {
    return deepPartialCache.get(classRef) as Type<DeepPartial<T>>;
  }

  const applyPartialDecoratorFn =
    options.skipNullProperties === false
      ? applyValidateIfDefinedDecorator
      : applyIsOptionalDecorator;

  const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);

  abstract class DeepPartialTypeClass {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }

  // Register in cache early to handle circular references
  deepPartialCache.set(classRef, DeepPartialTypeClass as Type<unknown>);

  const keysWithValidationConstraints = inheritValidationMetadata(
    classRef,
    DeepPartialTypeClass
  );
  if (keysWithValidationConstraints) {
    keysWithValidationConstraints
      .filter((key) => !fields.includes(key))
      .forEach((key) => applyPartialDecoratorFn(DeepPartialTypeClass, key));
  }

  inheritTransformationMetadata(classRef, DeepPartialTypeClass);

  function applyFields(fields: string[]) {
    clonePluginMetadataFactory(
      DeepPartialTypeClass as Type<unknown>,
      classRef.prototype,
      (metadata: Record<string, any>) =>
        mapValues(metadata, (item) => ({ ...item, required: false }))
    );

    if (DeepPartialTypeClass[METADATA_FACTORY_NAME]) {
      const pluginFields = Object.keys(
        DeepPartialTypeClass[METADATA_FACTORY_NAME]()
      );
      pluginFields.forEach((key) =>
        applyPartialDecoratorFn(DeepPartialTypeClass, key)
      );
    }

    fields.forEach((key) => {
      const metadata =
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          classRef.prototype,
          key
        ) || {};

      // Resolve the effective type, supporting lazy factory functions
      let resolvedType = metadata.type;
      if (typeof resolvedType === 'function' && resolvedType.length === 0) {
        try {
          resolvedType = resolvedType();
        } catch {
          resolvedType = metadata.type;
        }
      }

      // Unwrap array type: [SomeDto] → SomeDto
      if (Array.isArray(resolvedType) && resolvedType.length === 1) {
        resolvedType = resolvedType[0];
      }

      const nestedType = isDtoClass(resolvedType)
        ? DeepPartialType(resolvedType, options)
        : metadata.type;

      const decoratorFactory = ApiProperty({
        ...metadata,
        type: nestedType,
        required: false
      });
      decoratorFactory(DeepPartialTypeClass.prototype, key);
      applyPartialDecoratorFn(DeepPartialTypeClass, key);
    });
  }
  applyFields(fields);

  MetadataLoader.addRefreshHook(() => {
    const fields = modelPropertiesAccessor.getModelProperties(
      classRef.prototype
    );
    applyFields(fields);
  });

  return DeepPartialTypeClass as Type<DeepPartial<T>>;
}

/**
 * Recursively makes all properties of T optional, including nested objects.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

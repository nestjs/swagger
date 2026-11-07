import { Type } from '@nestjs/common';
import identity from 'es-toolkit/compat/identity';
import omitBy from 'es-toolkit/compat/omitBy';
import { DECORATORS } from '../constants.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor.js';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sanitizeTypeNameSegment(value: string | number | symbol): string {
  return String(value).replace(/[^A-Za-z0-9_$]/g, '_');
}

export function setMappedTypeClassName<T, K extends keyof T>(
  target: Function,
  prefix: string,
  classRef: Type<T>,
  keys: readonly K[] = []
) {
  // Resolved on access, as the parent's documented properties (and its own
  // name, when it is a mapped type too) are only final once plugin metadata
  // has been loaded
  Object.defineProperty(target, 'name', {
    configurable: true,
    get: () => {
      const parentTypeName = classRef.name || 'Anonymous';
      // Only the keys the parent documents are spelled out, so that the name
      // does not reveal properties hidden from the document
      const documentedKeys = new Set<string>(
        modelPropertiesAccessor.getModelProperties(
          classRef.prototype as Type<unknown>
        )
      );
      const mappedProperties = keys
        .filter((key) => documentedKeys.has(String(key)))
        .map((key) => capitalizeFirstLetter(sanitizeTypeNameSegment(key)))
        .join('');
      return `${prefix}${parentTypeName}${mappedProperties}`;
    }
  });
}

export function clonePluginMetadataFactory(
  target: Type<unknown>,
  parent: Type<unknown>,
  transformFn: (metadata: Record<string, any>) => Record<string, any> = identity
) {
  let targetMetadata = {};
  const classPrototype = parent;

  do {
    if (!parent.constructor) {
      return;
    }
    if (!parent.constructor[METADATA_FACTORY_NAME]) {
      continue;
    }
    // An ancestor's factory must not republish a property that a closer class
    // marked with "@ApiHideProperty()" (same rule as "applyMetadataFactory").
    const parentMetadata = omitBy(
      parent.constructor[METADATA_FACTORY_NAME](),
      (_value, key: string) =>
        modelPropertiesAccessor.isHiddenProperty(classPrototype, key, parent)
    );
    targetMetadata = {
      ...parentMetadata,
      ...targetMetadata
    };
  } while (
    (parent = Reflect.getPrototypeOf(parent) as Type<any>) &&
    parent !== Object.prototype &&
    parent
  );
  targetMetadata = transformFn(targetMetadata);

  if (target[METADATA_FACTORY_NAME]) {
    const originalFactory = target[METADATA_FACTORY_NAME];
    target[METADATA_FACTORY_NAME] = () => {
      const originalMetadata = originalFactory();
      return {
        ...originalMetadata,
        ...targetMetadata
      };
    };
  } else {
    target[METADATA_FACTORY_NAME] = () => targetMetadata;
  }
}

/**
 * Re-applying `@ApiProperty()` on a mapped type records every option of the
 * parent's metadata as explicit, including the `type` reflected from the
 * parent's TypeScript type. Gives the property the options that the parent
 * declared explicitly instead (plus `extraOptions`).
 */
export function inheritExplicitApiPropertyOptions(
  source: object,
  target: object,
  propertyKey: string,
  extraOptions: string[] = []
) {
  const explicitOptions = new Set<string>(extraOptions);
  for (
    let current: object | null = source;
    current && current !== Object.prototype;
    current = Reflect.getPrototypeOf(current)
  ) {
    (
      Reflect.getOwnMetadata(
        DECORATORS.API_MODEL_PROPERTY_EXPLICIT_OPTIONS,
        current,
        propertyKey
      ) ?? []
    ).forEach((option: string) => explicitOptions.add(option));
  }
  Reflect.defineMetadata(
    DECORATORS.API_MODEL_PROPERTY_EXPLICIT_OPTIONS,
    [...explicitOptions],
    target,
    propertyKey
  );
}

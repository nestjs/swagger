import { isArray, isUndefined, negate, pickBy } from 'lodash';
import { DECORATORS } from '../constants';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';
import { METHOD_METADATA } from '@nestjs/common/constants';
import { isConstructor } from '@nestjs/common/utils/shared.utils';

export function createMethodDecorator<T = any>(
  metakey: string,
  metadata: T,
  { overrideExisting } = { overrideExisting: true }
): MethodDecorator {
  return (
    target: object,
    key: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    if (typeof metadata === 'object') {
      const prevValue = Reflect.getMetadata(metakey, descriptor.value);
      if (prevValue && !overrideExisting) {
        return descriptor;
      }
      Reflect.defineMetadata(
        metakey,
        { ...prevValue, ...metadata },
        descriptor.value
      );
      return descriptor;
    }
    Reflect.defineMetadata(metakey, metadata, descriptor.value);
    return descriptor;
  };
}

export function createClassDecorator<T extends Array<any> = any>(
  metakey: string,
  metadata: T = [] as T
): ClassDecorator {
  return (target) => {
    const prevValue = Reflect.getMetadata(metakey, target) || [];
    Reflect.defineMetadata(metakey, [...prevValue, ...metadata], target);
    return target;
  };
}

export function createPropertyDecorator<T extends Record<string, any> = any>(
  metakey: string,
  metadata: T,
  overrideExisting = true
): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    const properties =
      Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, target) || [];

    const key = `:${propertyKey}`;
    if (!properties.includes(key)) {
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [...properties, `:${propertyKey}`],
        target
      );
    }
    const existingMetadata = Reflect.getMetadata(metakey, target, propertyKey);
    if (existingMetadata) {
      const newMetadata = pickBy(metadata, negate(isUndefined));
      const metadataToSave = overrideExisting
        ? {
            ...existingMetadata,
            ...newMetadata
          }
        : {
            ...newMetadata,
            ...existingMetadata
          };

      Reflect.defineMetadata(metakey, metadataToSave, target, propertyKey);
    } else {
      const type =
        target?.constructor?.[METADATA_FACTORY_NAME]?.()[propertyKey]?.type ??
        Reflect.getMetadata('design:type', target, propertyKey);

      Reflect.defineMetadata(
        metakey,
        {
          type,
          ...pickBy(metadata, negate(isUndefined))
        },
        target,
        propertyKey
      );
    }
  };
}

export function createMixedDecorator<T = any>(
  metakey: string,
  metadata: T
): MethodDecorator & ClassDecorator {
  return (
    target: object,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    if (descriptor) {
      let metadatas: any;
      if (Array.isArray(metadata)) {
        const previousMetadata =
          Reflect.getMetadata(metakey, descriptor.value) || [];
        metadatas = [...previousMetadata, ...metadata];
      } else {
        const previousMetadata =
          Reflect.getMetadata(metakey, descriptor.value) || {};
        metadatas = { ...previousMetadata, ...metadata };
      }
      Reflect.defineMetadata(metakey, metadatas, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(metakey, metadata, target);
    return target;
  };
}

export function createParamDecorator<T extends Record<string, any> = any>(
  metadata: T,
  initial: Partial<T>
): MethodDecorator & ClassDecorator {
  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    const paramOptions = {
      ...initial,
      ...pickBy(metadata, negate(isUndefined))
    };

    if (descriptor) {
      const parameters =
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, descriptor.value) || [];
      Reflect.defineMetadata(
        DECORATORS.API_PARAMETERS,
        [...parameters, paramOptions],
        descriptor.value
      );
      return descriptor;
    }

    if (typeof target === 'object') {
      return target;
    }

    const propertyKeys = Object.getOwnPropertyNames(target.prototype);

    for (const propertyKey of propertyKeys) {
      if (isConstructor(propertyKey)) {
        continue;
      }

      const methodDescriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyKey
      );

      if (!methodDescriptor) {
        continue;
      }

      const isApiMethod = Reflect.hasMetadata(
        METHOD_METADATA,
        methodDescriptor.value
      );

      if (!isApiMethod) {
        continue;
      }

      const parameters =
        Reflect.getMetadata(
          DECORATORS.API_PARAMETERS,
          methodDescriptor.value
        ) || [];
      Reflect.defineMetadata(
        DECORATORS.API_PARAMETERS,
        [...parameters, paramOptions],
        methodDescriptor.value
      );
    }
  };
}

export function getTypeIsArrayTuple(
  input: Function | [Function] | undefined | string | Record<string, any>,
  isArrayFlag: boolean
): [Function | undefined, boolean] {
  if (!input) {
    return [input as undefined, isArrayFlag];
  }
  if (isArrayFlag) {
    return [input as Function, isArrayFlag];
  }
  const isInputArray = isArray(input);
  const type = isInputArray ? input[0] : input;
  return [type as Function, isInputArray];
}

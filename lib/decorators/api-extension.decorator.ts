import { METHOD_METADATA } from '@nestjs/common/constants';
import { DECORATORS } from '../constants';
import { clone, merge } from 'lodash';
import { isConstructor } from '@nestjs/common/utils/shared.utils';

function applyExtension(target: any, key: string, value: any): void {
  const extensions =
    Reflect.getMetadata(DECORATORS.API_EXTENSION, target) || {};
  Reflect.defineMetadata(
    DECORATORS.API_EXTENSION,
    { [key]: value, ...extensions },
    target
  );
}

function applyPropertyExtension(
  target: object,
  propertyKey: string | symbol,
  extensionKey: string,
  value: any
): void {
  const extensions =
    Reflect.getMetadata(DECORATORS.API_EXTENSION, target, propertyKey) || {};
  Reflect.defineMetadata(
    DECORATORS.API_EXTENSION,
    { [extensionKey]: value, ...extensions },
    target,
    propertyKey
  );
}

/**
 * @publicApi
 */
export function ApiExtension(extensionKey: string, extensionProperties: any) {
  if (!extensionKey.startsWith('x-')) {
    throw new Error(
      'Extension key is not prefixed. Please ensure you prefix it with `x-`.'
    );
  }

  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    const extensionValue = clone(extensionProperties);

    // Method-level decorator
    if (descriptor) {
      applyExtension(descriptor.value, extensionKey, extensionValue);
      return descriptor;
    }

    // Property-level decorator: target is the class prototype (an object),
    // key is present (property name), but descriptor is absent.
    if (typeof target === 'object' && key !== undefined) {
      applyPropertyExtension(target, key, extensionKey, extensionValue);
      return;
    }

    // Class-level: target is the constructor (a function)
    if (typeof target === 'function') {
      // Look for API methods
      const apiMethods = Object.getOwnPropertyNames(target.prototype)
        .filter((propertyKey) => !isConstructor(propertyKey))
        .map((propertyKey) =>
          Object.getOwnPropertyDescriptor(target.prototype, propertyKey)?.value
        )
        .filter(
          (methodDescriptor) =>
            methodDescriptor !== undefined &&
            Reflect.hasMetadata(METHOD_METADATA, methodDescriptor)
        );

      // If we found API methods, apply the extension, otherwise assume it's a
      // DTO and apply to the class itself.
      if (apiMethods.length > 0) {
        apiMethods.forEach((method) =>
          applyExtension(method, extensionKey, extensionValue)
        );
      } else {
        applyExtension(target, extensionKey, extensionValue);
      }
    }

    return target;
  };
}

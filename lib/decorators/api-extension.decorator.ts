import clone from 'es-toolkit/compat/clone';
import { DECORATORS } from '../constants.js';

function applyExtension(target: any, key: string, value: any): void {
  // The target's own declarations only: the ones a class inherits are merged
  // in when the document is generated (see getClassExtensions)
  const extensions =
    Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, target) || {};
  Reflect.defineMetadata(
    DECORATORS.API_EXTENSION,
    { [key]: value, ...extensions },
    target
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

    // Ensure decorator is used on a class
    if (typeof target === 'object') {
      return target;
    }

    // Kept on the class rather than copied onto its route handlers, since an
    // inherited handler is shared with the base class. The explorer reads
    // them from the class chain, so a subclass's value wins on every route.
    applyExtension(target, extensionKey, extensionValue);

    return target;
  };
}

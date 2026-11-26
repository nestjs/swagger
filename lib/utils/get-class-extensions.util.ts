import { DECORATORS } from '../constants.js';

/**
 * Returns the extensions that class-level `@ApiExtension()` decorators
 * declared on a class and on the classes it extends. The value declared on
 * the most derived class wins for each key, while the keys keep the position
 * the class that declares them first gives them.
 */
export function getClassExtensions(
  metatype: Function | undefined
): Record<string, any> {
  if (!metatype || metatype === Function.prototype) {
    return {};
  }
  const own = Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, metatype);
  return {
    ...own,
    ...getClassExtensions(Object.getPrototypeOf(metatype)),
    ...own
  };
}

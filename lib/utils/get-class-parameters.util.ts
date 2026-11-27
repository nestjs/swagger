import { isSameParameter } from './is-same-parameter.util.js';

/**
 * Returns the params that class decorators stored under `metakey` for a class.
 * A class decorator appends its param to the ones the class inherits, so a
 * param that a subclass declares again (same location and name) is listed
 * next to the one of its base. The declaration of the most derived class
 * replaces the inherited ones, while the precedence between two params
 * declared on one class is kept.
 */
export function getClassParameters(metakey: string, metatype: Function): any[] {
  const parameters: any[] = Reflect.getMetadata(metakey, metatype) ?? [];
  if (parameters.length === 0) {
    return parameters;
  }
  const base = Object.getPrototypeOf(metatype);
  const inherited: any[] = Reflect.getMetadata(metakey, base) ?? [];
  const own = parameters.filter((param) => !inherited.includes(param));
  return [
    ...getClassParameters(metakey, base).filter(
      (param) => !own.some((ownParam) => isSameParameter(ownParam, param))
    ),
    ...own
  ];
}

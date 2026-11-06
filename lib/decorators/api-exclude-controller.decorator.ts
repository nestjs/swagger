import { DECORATORS } from '../constants.js';

/**
 * @publicApi
 */
export function ApiExcludeController(disable = true): ClassDecorator {
  return (target) => {
    // Define (not append) so that the flag of the nearest decorated class wins
    // over the one inherited from a parent class.
    Reflect.defineMetadata(
      DECORATORS.API_EXCLUDE_CONTROLLER,
      [disable],
      target
    );
    return target;
  };
}

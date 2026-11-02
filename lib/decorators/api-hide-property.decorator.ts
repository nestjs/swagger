import { DECORATORS } from '../constants.js';

/**
 * @publicApi
 */
export function ApiHideProperty(): PropertyDecorator {
  return (target: Record<string, any>, propertyKey: string | symbol) => {
    // Recorded on the declaring prototype so that a subclass can hide a
    // property that its parent class (or the CLI plugin) publishes.
    Reflect.defineMetadata(
      DECORATORS.API_MODEL_PROPERTY_HIDDEN,
      true,
      target,
      propertyKey
    );
  };
}

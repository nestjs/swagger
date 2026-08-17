import { DECORATORS } from '../constants.js';
import { createMethodDecorator } from './helpers.js';

/**
 * @publicApi
 */
export function ApiIncludeEndpoint(disable = true): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_INCLUDE_ENDPOINT, {
    disable
  });
}

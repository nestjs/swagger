import { DECORATORS } from '../constants.js';
import { createMethodDecorator } from './helpers.js';

/**
 * @publicApi
 */
export function ApiExcludeEndpoint(disable = true): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_EXCLUDE_ENDPOINT, {
    disable
  });
}

import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiExcludeEndpoint(disable = true): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_EXCLUDE_ENDPOINT, {
    disable
  });
}

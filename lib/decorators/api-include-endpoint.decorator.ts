import { DECORATORS } from '../constants';
import { createMethodDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiIncludeEndpoint(disable = true): MethodDecorator {
  return createMethodDecorator(DECORATORS.API_INCLUDE_ENDPOINT, {
    disable
  });
}

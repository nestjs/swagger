import { DECORATORS } from '../constants';
import { createClassDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiExcludeController(disable = true): ClassDecorator {
  return createClassDecorator(DECORATORS.API_EXCLUDE_CONTROLLER, [disable]);
}

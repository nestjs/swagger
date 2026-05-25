import { DECORATORS } from '../constants.js';
import { createMixedDecorator } from './helpers.js';

/**
 * @publicApi
 */
export function ApiProduces(...mimeTypes: string[]) {
  return createMixedDecorator(DECORATORS.API_PRODUCES, mimeTypes);
}

import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiProduces(...mimeTypes: string[]) {
  return createMixedDecorator(DECORATORS.API_PRODUCES, mimeTypes);
}

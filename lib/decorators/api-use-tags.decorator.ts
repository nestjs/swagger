import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiTags(...tags: string[]) {
  return createMixedDecorator(DECORATORS.API_TAGS, tags);
}

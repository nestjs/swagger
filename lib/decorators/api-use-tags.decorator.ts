import { DECORATORS } from '../constants';
import { createMixedDecorator } from './helpers';

export function ApiUseTags(...tags: string[]) {
  return createMixedDecorator(DECORATORS.API_USE_TAGS, tags);
}

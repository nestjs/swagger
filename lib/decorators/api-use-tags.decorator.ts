import { DECORATORS } from '../constants.js';
import { ApiTagOptions } from '../interfaces/open-api-spec.interface.js';
import { createMixedDecorator } from './helpers.js';

/**
 * @publicApi
 */
export function ApiTags(...tags: (string | ApiTagOptions)[]) {
  const normalizedTags = tags.map((tag) =>
    typeof tag === 'string' ? tag : tag.name
  );
  return createMixedDecorator(DECORATORS.API_TAGS, normalizedTags);
}

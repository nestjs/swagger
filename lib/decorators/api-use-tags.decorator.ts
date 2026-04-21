import { DECORATORS } from '../constants';
import { ApiTagOptions } from '../interfaces/open-api-spec.interface';
import { createMixedDecorator } from './helpers';

/**
 * @publicApi
 */
export function ApiTags(...tags: (string | ApiTagOptions)[]) {
  const normalizedTags = tags.map((tag) =>
    typeof tag === 'string' ? tag : tag.name
  );
  return createMixedDecorator(DECORATORS.API_TAGS, normalizedTags);
}

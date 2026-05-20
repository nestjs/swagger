import { Logger } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { ApiTagOptions } from '../interfaces/open-api-spec.interface';
import { createMixedDecorator } from './helpers';

const logger = new Logger('ApiTags');

/**
 * @publicApi
 */
export function ApiTags(...tags: (string | ApiTagOptions)[]) {
  const normalizedTags = tags.map((tag) => {
    if (typeof tag === 'string') {
      return tag;
    }
    if (tag.parent !== undefined || tag.kind !== undefined) {
      logger.warn(
        `Tag "${tag.name}" was declared with hierarchy fields (parent/kind) on @ApiTags, ` +
          `which are dropped. Define them via DocumentBuilder.addTag("${tag.name}", ` +
          `description, { parent, kind }) so they reach the root-level tags of the document.`
      );
    }
    return tag.name;
  });
  return createMixedDecorator(DECORATORS.API_TAGS, normalizedTags);
}

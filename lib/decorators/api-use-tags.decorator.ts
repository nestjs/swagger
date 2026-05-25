import { Logger } from '@nestjs/common';
import { DECORATORS } from '../constants.js';
import { ApiTagOptions } from '../interfaces/open-api-spec.interface.js';
import { createMixedDecorator } from './helpers.js';

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
      logger.warn(`Tag "${tag.name}" includes hierarchy fields (parent/kind) defined via @ApiTags, but those values are ignored there. Define them with DocumentBuilder.addTag("${tag.name}", description, { parent, kind }) to include them in the document's root-level tags.`);
    }
    return tag.name;
  });
  return createMixedDecorator(DECORATORS.API_TAGS, normalizedTags);
}

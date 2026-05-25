import { ContentObject } from '../interfaces/open-api-spec.interface.js';
import { removeUndefinedKeys } from '../utils/remove-undefined-keys.js';

export class MimetypeContentWrapper {
  wrap(
    mimetype: string[],
    obj: Record<string, any>
  ): Record<'content', ContentObject> {
    const content = mimetype.reduce(
      (acc, item) => ({ ...acc, [item]: removeUndefinedKeys(obj) }),
      {}
    );
    return { content };
  }
}

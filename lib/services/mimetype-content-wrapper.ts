import { cloneDeep } from 'lodash';
import { ContentObject } from '../interfaces/open-api-spec.interface';
import { removeUndefinedKeys } from '../utils/remove-undefined-keys';

export class MimetypeContentWrapper {
  wrap(
    mimetype: string[],
    obj: Record<string, any>
  ): Record<'content', ContentObject> {
    // Clone the object for each mimetype so the resulting media-type entries do
    // not share the same (mutable) reference. Without this, mutating one
    // media type's schema later would silently mutate all of them, and the
    // caller's source object would be mutated by `removeUndefinedKeys`.
    const content = mimetype.reduce(
      (acc, item) => ({ ...acc, [item]: removeUndefinedKeys(cloneDeep(obj)) }),
      {}
    );
    return { content };
  }
}

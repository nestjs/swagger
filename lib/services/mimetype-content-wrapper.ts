import { ContentObject } from '../interfaces/open-api-spec.interface';

function removeUndefinedKeys(obj: { [x: string]: any }) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

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

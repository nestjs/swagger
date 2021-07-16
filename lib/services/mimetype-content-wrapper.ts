import { ContentObject } from '../interfaces/open-api-spec.interface';

export class MimetypeContentWrapper {
  wrap(
    mimetype: string[],
    obj: Record<string, any>
  ): Record<'content', ContentObject> {
    const content = mimetype.reduce(
      (acc, item) => {
        if (obj.examples === undefined) {
          delete obj.examples;
        }
        return { ...acc, [item]: obj };
      },
      {}
    );
    return { content };
  }
}

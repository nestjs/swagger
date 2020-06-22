import { ContentObject } from '../interfaces/open-api-spec.interface';

export class MimetypeContentWrapper {
  wrap(
    mimetype: string[],
    obj: Record<string, any>
  ): Record<'content', ContentObject> {
    const content = mimetype
      .map((item) => ({
        [item]: obj
      }))
      .reduce((a, b) => ({ ...a, ...b }), {});
    return { content };
  }
}

import { omit } from 'lodash';
import { ApiResponseMetadata, ApiResponseSchemaHost } from '../decorators';
import { getSchemaPath } from '../utils';
import { MimetypeContentWrapper } from './mimetype-content-wrapper';

export class ResponseObjectMapper {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();

  toArrayRefObject(
    response: Record<string, any>,
    name: string,
    produces: string[]
  ) {
    return {
      ...response,
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          type: 'array',
          items: {
            $ref: getSchemaPath(name)
          }
        },
        ...(response.example ? { example: response.example } : {})
      })
    };
  }

  toRefObject(response: Record<string, any>, name: string, produces: string[]) {
    return {
      ...response,
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          $ref: getSchemaPath(name)
        },
        ...(response.example ? { example: response.example } : {})
      })
    };
  }

  wrapSchemaWithContent(
    response: ApiResponseSchemaHost & ApiResponseMetadata,
    produces: string[]
  ) {
    if (!response.schema && !response.example) {
      return response;
    }
    const content = this.mimetypeContentWrapper.wrap(produces, {
      ...(response.schema ? { schema: response.schema } : {}),
      ...(response.example ? { example: response.example } : {})
    });
    return {
      ...omit(response, ['schema', 'example']),
      ...content
    };
  }
}

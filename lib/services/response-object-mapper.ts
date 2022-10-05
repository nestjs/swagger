import omit from 'lodash/omit';
import { ApiResponseSchemaHost } from '../decorators';
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
        }
      })
    };
  }

  toRefObject(response: Record<string, any>, name: string, produces: string[]) {
    return {
      ...response,
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema: {
          $ref: getSchemaPath(name)
        }
      })
    };
  }

  wrapSchemaWithContent(response: ApiResponseSchemaHost, produces: string[]) {
    if (!response.schema) {
      return response;
    }
    const content = this.mimetypeContentWrapper.wrap(produces, {
      schema: response.schema
    });
    return {
      ...omit(response, 'schema'),
      ...content
    };
  }
}

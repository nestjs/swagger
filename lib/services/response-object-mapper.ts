import { omit, pick } from 'lodash';
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
    const exampleKeys = ['example', 'examples'];
    const arraySchema = {
      type: 'array',
      items: { $ref: getSchemaPath(name) }
    };
    const schema = response.nullable
      ? { oneOf: [arraySchema, { type: 'null' }] }
      : arraySchema;
    return {
      ...omit(response, [...exampleKeys, 'nullable']),
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      })
    };
  }

  toRefObject(response: Record<string, any>, name: string, produces: string[]) {
    const exampleKeys = ['example', 'examples'];
    const schema = response.nullable
      ? { oneOf: [{ $ref: getSchemaPath(name) }, { type: 'null' }] }
      : { $ref: getSchemaPath(name) };
    return {
      ...omit(response, [...exampleKeys, 'nullable']),
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      })
    };
  }

  wrapSchemaWithContent(
    response: ApiResponseSchemaHost & ApiResponseMetadata,
    produces: string[]
  ) {
    if (
      !response.schema &&
      !('example' in response) &&
      !('examples' in response)
    ) {
      return response;
    }
    const exampleKeys = ['example', 'examples'];
    const content = this.mimetypeContentWrapper.wrap(produces, {
      schema: response.schema,
      ...pick(response, exampleKeys)
    });

    const keysToOmit = [...exampleKeys, 'schema'];
    return {
      ...omit(response, keysToOmit),
      ...content
    };
  }
}

import { omit, pick } from 'es-toolkit/compat';
import {
  ApiResponseMetadata,
  ApiResponseSchemaHost
} from '../decorators/index.js';
import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { getSchemaPath } from '../utils/index.js';
import { MimetypeContentWrapper } from './mimetype-content-wrapper.js';

export class ResponseObjectMapper {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();

  toArrayRefObject(
    response: Record<string, any>,
    name: string,
    produces: string[],
    isRawSchema = false
  ) {
    const exampleKeys = ['example', 'examples'];
    const arraySchema = {
      type: 'array',
      items: { $ref: getSchemaPath(name) }
    };
    const schema = response.nullable
      ? this.wrapNullableSchema(arraySchema, isRawSchema)
      : arraySchema;
    return {
      ...omit(response, [...exampleKeys, 'nullable']),
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      })
    };
  }

  toRefObject(
    response: Record<string, any>,
    name: string,
    produces: string[],
    isRawSchema = false
  ) {
    const exampleKeys = ['example', 'examples'];
    const schema = response.nullable
      ? this.wrapNullableSchema({ $ref: getSchemaPath(name) }, isRawSchema)
      : { $ref: getSchemaPath(name) };
    return {
      ...omit(response, [...exampleKeys, 'nullable']),
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      })
    };
  }

  private wrapNullableSchema(
    schema: SchemaObject | ReferenceObject,
    isRawSchema: boolean
  ): SchemaObject {
    // Raw compositions can already allow null. anyOf avoids excluding it when
    // both branches match, and an enum-only null works in OpenAPI 3.0 and 3.1.
    return isRawSchema
      ? { anyOf: [schema, { enum: [null] }] }
      : { oneOf: [schema, { type: 'null' }] };
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

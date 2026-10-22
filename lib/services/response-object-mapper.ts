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
    produces: string[]
  ) {
    const exampleKeys = ['example', 'examples'];
    const arraySchema = {
      type: 'array',
      items: { $ref: getSchemaPath(name) }
    };
    const schema = response.nullable
      ? { ...arraySchema, nullable: true }
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
    const ref = { $ref: getSchemaPath(name) };
    const schema = response.nullable ? this.toNullableSchema(ref) : ref;
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
      return omit(response, ['nullable']);
    }
    const exampleKeys = ['example', 'examples'];
    const content = this.mimetypeContentWrapper.wrap(produces, {
      schema:
        response.nullable && response.schema
          ? this.toNullableSchema(response.schema)
          : response.schema,
      ...pick(response, exampleKeys)
    });

    const keysToOmit = [...exampleKeys, 'schema', 'nullable'];
    return {
      ...omit(response, keysToOmit),
      ...content
    };
  }

  private toNullableSchema(schema: SchemaObject | ReferenceObject) {
    // A `$ref` cannot carry sibling keywords, hence the `allOf` wrapper --
    // the same shape the schema object factory emits for nullable properties.
    // 3.1 documents get this rewritten into a union by convertNullableToOas31.
    return '$ref' in schema
      ? { nullable: true, type: 'object', allOf: [schema] }
      : { ...schema, nullable: true };
  }
}

import { omit, pick } from 'es-toolkit/compat';
import {
  ApiResponseMetadata,
  ApiResponseSchemaHost
} from '../decorators/index.js';
import { getSchemaPath } from '../utils/index.js';
import { isOas31OrLater } from '../utils/is-oas31-or-later.util.js';
import { MimetypeContentWrapper } from './mimetype-content-wrapper.js';

export class ResponseObjectMapper {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly isOas31: boolean;

  constructor(openApiVersion: string = '3.0.0') {
    this.isOas31 = isOas31OrLater(openApiVersion);
  }

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
      ? this.makeNullable(arraySchema)
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
      ? this.makeNullable({ $ref: getSchemaPath(name) })
      : { $ref: getSchemaPath(name) };
    return {
      ...omit(response, [...exampleKeys, 'nullable']),
      ...this.mimetypeContentWrapper.wrap(produces, {
        schema,
        ...pick(response, exampleKeys)
      })
    };
  }

  /**
   * 3.1 (JSON Schema 2020-12) has no `nullable` keyword and spells
   * nullability as a union; 3.0 has no `type: 'null'` and needs the keyword.
   * A `$ref` cannot carry sibling keywords in 3.0 either, hence the `allOf`
   * wrapper — the same shape the schema object factory emits for properties.
   */
  private makeNullable(schema: Record<string, any>) {
    if (this.isOas31) {
      return { oneOf: [schema, { type: 'null' }] };
    }
    return '$ref' in schema
      ? { nullable: true, type: 'object', allOf: [schema] }
      : { ...schema, nullable: true };
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

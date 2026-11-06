import omit from 'es-toolkit/compat/omit';
import pick from 'es-toolkit/compat/pick';
import {
  ApiResponseMetadata,
  ApiResponseSchemaHost
} from '../decorators/index.js';
import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { getSchemaPath } from '../utils/index.js';
import { wrapRefInAllOf } from '../utils/wrap-ref-in-all-of.util.js';
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
    produces: string[],
    schemas?: Record<string, SchemaObject>
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
          ? this.toNullableSchema(response.schema, schemas)
          : response.schema,
      ...pick(response, exampleKeys)
    });

    const keysToOmit = [...exampleKeys, 'schema', 'nullable'];
    return {
      ...omit(response, keysToOmit),
      ...content
    };
  }

  private toNullableSchema(
    schema: SchemaObject | ReferenceObject,
    schemas?: Record<string, SchemaObject>
  ): SchemaObject | ReferenceObject {
    if (!('$ref' in schema)) {
      return { ...schema, nullable: true };
    }
    // A `$ref` cannot carry sibling keywords, hence the `allOf` wrapper --
    // the same shape the schema object factory emits for nullable properties.
    // 3.1 documents get this rewritten into a union by convertNullableToOas31.
    const wrapped = wrapRefInAllOf({
      ...schema,
      nullable: true
    }) as SchemaObject;
    // OpenAPI 3.0 only applies `nullable` next to `type`. Models are objects,
    // but a `$ref` given here may point to any schema (e.g. a string enum), so
    // `type: 'object'` is only added when the target is not known to be
    // something else.
    if (
      wrapped.type !== undefined ||
      !this.mayBeObjectRef(schema.$ref, schemas)
    ) {
      return wrapped;
    }
    const { allOf, ...rest } = wrapped;
    return { ...rest, type: 'object', allOf };
  }

  private mayBeObjectRef(
    $ref: string,
    schemas?: Record<string, SchemaObject>
  ): boolean {
    const prefix = getSchemaPath('');
    const target = $ref.startsWith(prefix)
      ? schemas?.[$ref.slice(prefix.length)]
      : undefined;
    return !target || target.type === 'object';
  }
}

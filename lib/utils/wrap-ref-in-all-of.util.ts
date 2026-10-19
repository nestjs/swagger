import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';

/**
 * OpenAPI 3.0 ignores keys placed next to a `$ref`, so a `$ref` schema that
 * carries any other keyword (or extra `allOf` entries) has its `$ref` moved
 * into `allOf`. Existing `allOf` entries are kept, followed by `extraAllOf`
 * and then the `$ref` itself. A bare `$ref` is returned unchanged.
 */
export function wrapRefInAllOf(
  schema: ReferenceObject & Record<string, any>,
  extraAllOf: Array<SchemaObject | ReferenceObject> = []
): SchemaObject | ReferenceObject {
  const { $ref, allOf, ...rest } = schema;
  const allOfEntries = [...(Array.isArray(allOf) ? allOf : []), ...extraAllOf];
  if (Object.keys(rest).length === 0 && allOfEntries.length === 0) {
    return { $ref };
  }
  return { ...rest, allOf: [...allOfEntries, { $ref }] };
}

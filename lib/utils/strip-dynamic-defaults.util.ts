import { DenormalizedDoc } from '../interfaces/denormalized-doc.interface.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';

/**
 * Returns true when a default value is "dynamic" — i.e. it is a runtime
 * object that is not a plain JSON-serialisable literal such as a string,
 * number, boolean, null, a plain object `{}`, or an array.
 *
 * The canonical example is `new Date()` whose ISO string representation
 * changes on every server restart and therefore produces unnecessary git diffs
 * in committed OpenAPI spec files.
 */
function isDynamicDefault(value: unknown): boolean {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return false;
  }
  if (typeof value === 'function') {
    return true;
  }
  if (Array.isArray(value)) {
    return false;
  }
  // Plain object literal — safe
  if (typeof value === 'object' && value.constructor === Object) {
    return false;
  }
  // Anything else (Date, Map, Set, class instances, …) is dynamic
  return true;
}

/**
 * Recursively walks the schemas map and removes any `default` property whose
 * value would produce a different serialization on each server start.
 */
export function stripDynamicDefaults(
  schemas: Record<string, SchemaObject>
): void {
  for (const schema of Object.values(schemas)) {
    stripFromSchema(schema);
  }
}

/**
 * Removes the dynamic `default` values from the schemas that are inlined into
 * an operation instead of being registered as component schemas: parameters
 * (e.g. the properties of a `@Query()` DTO), request bodies and responses.
 */
export function stripDynamicOperationDefaults(route: DenormalizedDoc): void {
  const { root, responses } = route;
  for (const parameter of (root?.parameters ?? []) as any[]) {
    stripFromSchema(parameter.schema);
    stripFromContent(parameter.content);
  }
  stripFromContent((root?.requestBody as any)?.content);
  stripFromResponses(root?.responses);
  stripFromResponses(responses);
}

function stripFromResponses(responses: object | undefined): void {
  for (const response of Object.values(responses ?? {}) as any[]) {
    stripFromContent(response?.content);
    for (const header of Object.values(response?.headers ?? {}) as any[]) {
      stripFromSchema(header?.schema);
    }
  }
}

function stripFromContent(content: Record<string, any> | undefined): void {
  for (const mediaType of Object.values(content ?? {})) {
    stripFromSchema(mediaType?.schema);
  }
}

function stripFromSchema(schema: SchemaObject | null | undefined): void {
  if (!schema || typeof schema !== 'object') {
    return;
  }
  if ('default' in schema && isDynamicDefault((schema as any).default)) {
    delete (schema as any).default;
  }
  if (schema.properties) {
    for (const prop of Object.values(schema.properties)) {
      stripFromSchema(prop as SchemaObject);
    }
  }
  if (schema.items) {
    stripFromSchema(schema.items as SchemaObject);
  }
  if (schema.additionalProperties) {
    stripFromSchema(schema.additionalProperties as SchemaObject);
  }
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    if ((schema as any)[key]) {
      for (const sub of (schema as any)[key]) {
        stripFromSchema(sub);
      }
    }
  }
}

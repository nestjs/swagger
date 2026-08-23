import {
  OpenAPIObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';

type UnknownRecord = Record<string, any>;

const COMBINATOR_KEYS = ['allOf', 'oneOf', 'anyOf'] as const;

/**
 * Keywords whose values are arbitrary user data rather than subschemas. The
 * OpenAPI/JSON Schema object model has no other free-form positions, so
 * skipping these (plus `x-` extensions) is enough to never mistake a data
 * key for the `nullable` keyword.
 */
const DATA_KEYS = new Set(['example', 'examples', 'default', 'const', 'enum']);

/**
 * Maps whose keys are user-chosen names. Their keys must never be matched
 * against the rules above — a property or header may legitimately be called
 * `example` or `x-total`.
 */
const NAME_KEYED_MAPS = new Set([
  'properties',
  'patternProperties',
  '$defs',
  'schemas',
  'headers'
]);

/**
 * Rewrites the OpenAPI 3.0 `nullable` keyword into its OpenAPI 3.1 (JSON
 * Schema 2020-12) equivalent everywhere in the document, in place.
 */
export function convertNullableToOas31(document: OpenAPIObject): void {
  walk(document);
}

function walk(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(walk);
    return;
  }
  if (!isObject(node)) {
    return;
  }

  // Children first: converting a node may move it inside an `anyOf` union,
  // and its subschemas must already be in their final shape by then.
  for (const [key, value] of Object.entries(node)) {
    if (DATA_KEYS.has(key) || key.startsWith('x-')) {
      continue;
    }
    if (NAME_KEYED_MAPS.has(key) && isObject(value)) {
      Object.values(value).forEach(walk);
    } else {
      walk(value);
    }
  }

  convertSchema(node);
}

function convertSchema(schema: UnknownRecord): void {
  if (typeof schema.nullable !== 'boolean') {
    return;
  }
  const isNullable = schema.nullable;
  delete schema.nullable;

  if (!isNullable) {
    return;
  }

  const combinator = COMBINATOR_KEYS.find((key) => Array.isArray(schema[key]));

  if ('$ref' in schema || combinator) {
    schema.anyOf = [extractInnerSchema(schema, combinator), { type: 'null' }];
    return;
  }

  if (schema.type !== undefined) {
    const types: string[] = Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
    schema.type = types.includes('null') ? types : [...types, 'null'];
  }

  if (Array.isArray(schema.enum) && !schema.enum.includes(null)) {
    schema.enum = [...schema.enum, null];
  }
}

/**
 * Moves the reference / composite part of a nullable schema into the first
 * member of the `anyOf` union, leaving annotation keywords (`description`,
 * `title`, …) as siblings of the union where they still apply.
 */
function extractInnerSchema(
  schema: UnknownRecord,
  combinator: (typeof COMBINATOR_KEYS)[number] | undefined
): SchemaObject | ReferenceObject {
  const inner: UnknownRecord = {};

  if ('$ref' in schema) {
    inner.$ref = schema.$ref;
    delete schema.$ref;
  }

  if (combinator) {
    const members = schema[combinator];
    delete schema[combinator];

    // `{ type: 'object', allOf: [{ $ref }] }` is the wrapper the schema object
    // factory emits so that 3.0 validators accept a nullable reference. The
    // union replaces it, so the synthetic `type` must not leak into 3.1.
    if (schema.type === 'object' && !('properties' in schema)) {
      delete schema.type;
    }

    if (!('$ref' in inner) && combinator === 'allOf' && members.length === 1) {
      Object.assign(inner, members[0]);
    } else {
      inner[combinator] = members;
    }
  }

  return inner as SchemaObject | ReferenceObject;
}

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

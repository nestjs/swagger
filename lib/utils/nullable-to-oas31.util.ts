import {
  OpenAPIObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';

type UnknownRecord = Record<string, any>;

const COMBINATOR_KEYS = ['allOf', 'oneOf', 'anyOf'] as const;

const OPERATION_KEYS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
  'query'
] as const;

/**
 * Rewrites the OpenAPI 3.0 `nullable` keyword into its OpenAPI 3.1 (JSON
 * Schema 2020-12) equivalent everywhere in the document, in place.
 *
 * JSON Schema 2020-12 removed `nullable` and ignores unknown keywords, so a
 * 3.1 document that keeps the keyword silently loses the null case. The 3.1
 * spellings are a type union (`{ "type": ["string", "null"] }`) for typed
 * schemas and an `anyOf` union for references and composite schemas — the
 * same pattern the response object factory already uses for inline responses.
 *
 * Callers are responsible for the version check: this must only run for
 * documents declaring OpenAPI 3.1 or later (see `isOas31OrLater`).
 */
export function convertNullableToOas31(document: OpenAPIObject): void {
  if (!document || typeof document !== 'object') {
    return;
  }
  walkPaths(document.paths as UnknownRecord);
  walkPaths((document as UnknownRecord).webhooks);
  walkComponents((document as UnknownRecord).components);
}

function walkComponents(components: UnknownRecord | undefined): void {
  if (!isObject(components)) {
    return;
  }
  walkRecord(components.schemas, walkSchema);
  walkRecord(components.parameters, walkParameterLike);
  walkRecord(components.headers, walkParameterLike);
  walkRecord(components.requestBodies, walkBodyLike);
  walkRecord(components.responses, walkResponse);
  walkRecord(components.callbacks, walkPaths);
  walkRecord(components.pathItems, walkPathItem);
}

function walkPaths(paths: UnknownRecord | undefined): void {
  walkRecord(paths, walkPathItem);
}

function walkPathItem(pathItem: UnknownRecord | undefined): void {
  if (!isObject(pathItem)) {
    return;
  }
  walkArray(pathItem.parameters, walkParameterLike);
  for (const key of OPERATION_KEYS) {
    walkOperation(pathItem[key]);
  }
}

function walkOperation(operation: UnknownRecord | undefined): void {
  if (!isObject(operation)) {
    return;
  }
  walkArray(operation.parameters, walkParameterLike);
  walkBodyLike(operation.requestBody);
  walkRecord(operation.responses, walkResponse);
  walkRecord(operation.callbacks, walkPaths);
}

function walkResponse(response: UnknownRecord | undefined): void {
  if (!isObject(response)) {
    return;
  }
  walkRecord(response.headers, walkParameterLike);
  walkContent(response.content);
}

function walkBodyLike(body: UnknownRecord | undefined): void {
  if (!isObject(body)) {
    return;
  }
  walkContent(body.content);
}

/** Parameters and headers share the `schema` / `content` shape. */
function walkParameterLike(parameter: UnknownRecord | undefined): void {
  if (!isObject(parameter)) {
    return;
  }
  walkSchema(parameter.schema);
  walkContent(parameter.content);
}

function walkContent(content: UnknownRecord | undefined): void {
  walkRecord(content, (mediaType) => {
    if (!isObject(mediaType)) {
      return;
    }
    walkSchema(mediaType.schema);
    walkRecord(mediaType.encoding, (encoding) => {
      if (isObject(encoding)) {
        walkRecord(encoding.headers, walkParameterLike);
      }
    });
  });
}

function walkSchema(schema: UnknownRecord | undefined): void {
  if (!isObject(schema)) {
    return;
  }

  // Children first: converting a node may move it inside an `anyOf` union,
  // and its subschemas must already be in their final shape by then.
  walkRecord(schema.properties, walkSchema);
  walkRecord(schema.patternProperties, walkSchema);
  walkSchema(schema.additionalProperties);
  walkSchema(schema.items);
  walkSchema(schema.not);
  walkArray(schema.prefixItems, walkSchema);
  for (const key of COMBINATOR_KEYS) {
    walkArray(schema[key], walkSchema);
  }

  convertSchema(schema);
}

function convertSchema(schema: UnknownRecord): void {
  if (!('nullable' in schema)) {
    return;
  }
  const isNullable = schema.nullable === true;
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

  appendNullEnumValue(schema);
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

function appendNullEnumValue(schema: UnknownRecord): void {
  if (Array.isArray(schema.enum) && !schema.enum.includes(null)) {
    schema.enum = [...schema.enum, null];
  }
}

function walkRecord(record: unknown, visit: (value: any) => void): void {
  if (!isObject(record)) {
    return;
  }
  for (const value of Object.values(record)) {
    visit(value);
  }
}

function walkArray(array: unknown, visit: (value: any) => void): void {
  if (!Array.isArray(array)) {
    return;
  }
  for (const value of array) {
    visit(value);
  }
}

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

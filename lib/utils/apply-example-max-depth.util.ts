import { SchemaObject } from '../interfaces/open-api-spec.interface';

/**
 * Recursively walks every schema in `schemas` and truncates `example` /
 * `examples` values whose nested object/array depth exceeds the effective
 * limit. The schema graph itself (`$ref`, `properties`, `items`, combinators)
 * is not modified — only example values are rewritten.
 *
 * Per-schema `exampleMaxDepth` (set via `@ApiProperty({ exampleMaxDepth })`)
 * overrides `globalMaxDepth` for that entry only and is stripped from the
 * output so it never leaks into the published OpenAPI document.
 *
 * When `globalMaxDepth` is `undefined` and no schema declares an override,
 * the call is a no-op aside from removing any leftover `exampleMaxDepth`
 * keys produced by the decorator.
 */
export function applyExampleMaxDepth(
  schemas: Record<string, SchemaObject>,
  globalMaxDepth: number | undefined
): void {
  for (const schema of Object.values(schemas)) {
    walkSchema(schema as Record<string, unknown>, globalMaxDepth);
  }
}

function walkSchema(
  schema: Record<string, unknown> | null | undefined,
  globalMaxDepth: number | undefined
): void {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  const perPropOverride =
    typeof schema.exampleMaxDepth === 'number'
      ? (schema.exampleMaxDepth as number)
      : undefined;
  const effectiveMax =
    perPropOverride !== undefined ? perPropOverride : globalMaxDepth;

  if (effectiveMax !== undefined) {
    if ('example' in schema) {
      schema.example = trimExampleValue(schema.example, effectiveMax);
    }
    if ('examples' in schema && Array.isArray(schema.examples)) {
      schema.examples = (schema.examples as unknown[]).map((entry) =>
        trimExampleValue(entry, effectiveMax)
      );
    }
  }

  // Strip the metadata so it never reaches the published OpenAPI output, even
  // when no truncation actually ran (e.g. override set but example absent).
  if ('exampleMaxDepth' in schema) {
    delete schema.exampleMaxDepth;
  }

  if (schema.properties && typeof schema.properties === 'object') {
    for (const prop of Object.values(
      schema.properties as Record<string, unknown>
    )) {
      walkSchema(prop as Record<string, unknown>, globalMaxDepth);
    }
  }
  if (schema.items) {
    walkSchema(schema.items as Record<string, unknown>, globalMaxDepth);
  }
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    const combinator = schema[key];
    if (Array.isArray(combinator)) {
      for (const sub of combinator) {
        walkSchema(sub as Record<string, unknown>, globalMaxDepth);
      }
    }
  }
  if (
    schema.additionalProperties &&
    typeof schema.additionalProperties === 'object'
  ) {
    walkSchema(
      schema.additionalProperties as Record<string, unknown>,
      globalMaxDepth
    );
  }
}

function trimExampleValue(
  value: unknown,
  remainingDepth: number,
  path: WeakSet<object> = new WeakSet()
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const isArray = Array.isArray(value);
  // Walk only plain object literals and arrays. Date / Map / Set / Buffer /
  // class instances serialize through their own `toJSON` (or as primitives)
  // and `Object.entries(new Date())` is `[]`, which would otherwise rewrite
  // user-supplied `@ApiProperty({ example: new Date() })` to `{}`.
  if (!isArray && (value as { constructor?: Function }).constructor !== Object) {
    return value;
  }

  if (remainingDepth <= 0) {
    return isArray ? [] : {};
  }
  // Path-local cycle guard: only short-circuit when the same object is
  // reachable through a real cycle, not when sibling properties simply share
  // a reference (a non-cyclic DAG, e.g. `{ a: shared, b: shared }`).
  if (path.has(value as object)) {
    return isArray ? [] : {};
  }
  path.add(value as object);
  try {
    if (isArray) {
      return (value as unknown[]).map((entry) =>
        trimExampleValue(entry, remainingDepth - 1, path)
      );
    }
    const trimmed: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      trimmed[key] = trimExampleValue(child, remainingDepth - 1, path);
    }
    return trimmed;
  } finally {
    path.delete(value as object);
  }
}

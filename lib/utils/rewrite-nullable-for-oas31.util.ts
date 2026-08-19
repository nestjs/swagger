/**
 * OpenAPI 3.1 uses JSON Schema 2020-12, which dropped the `nullable` keyword.
 * Convert 3.0-style `{ type: T, nullable: true }` into 3.1 unions.
 */
export function rewriteNullableForOas31(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      rewriteNullableForOas31(item);
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const nested of Object.values(obj)) {
    rewriteNullableForOas31(nested);
  }

  if (obj.nullable !== true) {
    return;
  }
  delete obj.nullable;

  if (typeof obj.type === 'string') {
    obj.type = [obj.type, 'null'];
    return;
  }
  if (Array.isArray(obj.type)) {
    if (!obj.type.includes('null')) {
      obj.type = [...obj.type, 'null'];
    }
    return;
  }

  const rest = { ...obj };
  for (const key of Object.keys(obj)) {
    delete obj[key];
  }
  obj.oneOf = [rest, { type: 'null' }];
}

/**
 * Whether two parameters are the same one. OpenAPI identifies a parameter by
 * its location and name, and HTTP header names are case-insensitive.
 */
export function isSameParameter(
  left: { in?: string; name?: string | number | object },
  right: { in?: string; name?: string | number | object }
): boolean {
  if (left.in !== right.in) {
    return false;
  }
  if (
    left.in === 'header' &&
    typeof left.name === 'string' &&
    typeof right.name === 'string'
  ) {
    return left.name.toLowerCase() === right.name.toLowerCase();
  }
  return left.name === right.name;
}

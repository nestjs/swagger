export function reverseObjectKeys(
  originalObject: Record<string, any>
): Record<string, any> {
  const reversedObject = {};
  const keys = Object.keys(originalObject).reverse();
  for (const key of keys) {
    reversedObject[key] = originalObject[key];
  }
  return reversedObject;
}

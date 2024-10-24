export function removeUndefinedKeys(obj: { [x: string]: any }) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

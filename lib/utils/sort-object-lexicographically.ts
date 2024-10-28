export function sortObjectLexicographically(obj: { [key: string]: any }): {
  [key: string]: any;
} {
  const sortedKeys = Object.keys(obj).sort();

  const sortedObj: { [key: string]: any } = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }

  return sortedObj;
}

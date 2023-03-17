export function normalizeRelPath(input: string) {
  // replaces duplicate slashes with single slash: ////test///1 -> /test/1
  const output = input.replace(/\/\/+/g, '/');
  return output;
}

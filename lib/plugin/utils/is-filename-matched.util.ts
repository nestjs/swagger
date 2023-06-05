export const isFilenameMatched = (patterns: string[], filename: string) =>
  patterns.some((path) => filename.includes(path));

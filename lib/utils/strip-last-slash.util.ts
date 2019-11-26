export function stripLastSlash(path: string): string {
  return path && path[path.length - 1] === '/'
    ? path.slice(0, path.length - 1)
    : path;
}

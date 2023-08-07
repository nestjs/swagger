import * as pathLib from 'path';

export function resolvePath(path: string): string {
  return path ? pathLib.resolve(path) : path;
}
import { merge, uniq } from 'es-toolkit/compat';

export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq(merge(a, b) as any) as unknown as T;
}

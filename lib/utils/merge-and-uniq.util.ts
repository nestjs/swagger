import { isEmpty, uniq } from 'es-toolkit/compat';

export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq((isEmpty(b) ? a : b) as any) as unknown as T;
}

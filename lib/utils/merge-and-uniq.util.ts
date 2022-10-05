import merge from 'lodash/merge';
import uniq from 'lodash/uniq';

export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq(merge(a, b) as any) as unknown as T;
}

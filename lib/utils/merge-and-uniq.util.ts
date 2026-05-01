import lodash from 'lodash';
const { merge, uniq } = lodash;

export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq(merge(a, b) as any) as unknown as T;
}

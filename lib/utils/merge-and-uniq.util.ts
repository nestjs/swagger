import isEmpty from 'es-toolkit/compat/isEmpty';
import uniq from 'es-toolkit/compat/uniq';

export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq((isEmpty(b) ? a : b) as any) as unknown as T;
}

import { uniq } from 'es-toolkit/compat';

/**
 * Returns the union of two metadata lists (e.g. class-level and method-level
 * `@ApiConsumes`/`@ApiProduces` values), preserving order and dropping
 * duplicates. Neither input is mutated.
 */
export function mergeAndUniq<T = any>(a: unknown = [], b: unknown = []): T {
  return uniq([...(a as unknown[]), ...(b as unknown[])]) as unknown as T;
}

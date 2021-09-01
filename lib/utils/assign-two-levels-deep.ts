/**
 * Merge one level deeper than a regular Object.assign().
 *
 * @example
 *
 * ```
 * const a = {foo: {bar: 1, baz: 2, bag: {x : 1}}};
 * const b = {foo: {baz: 3, bag: {y: 2}}};
 *
 * assignTwoLevelsDeep(a, b);
 *
 * // a is {foo: {bar: 1, baz: 3, bag: {y: 2}}}
 * ```
 */
export function assignTwoLevelsDeep<TObject, T>(_dest: TObject, ...args: T[]) {
  const dest = _dest as TObject & T;

  for (const arg of args) {
    for (const [key, value] of Object.entries(arg ?? {}) as Array<
      [keyof T, T[keyof T]]
    >) {
      dest[key] = { ...dest[key], ...value };
    }
  }

  return dest;
}

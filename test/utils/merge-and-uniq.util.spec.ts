import { mergeAndUniq } from '../../lib/utils/merge-and-uniq.util';

describe('mergeAndUniq', () => {
  it.each([
    [undefined, undefined, []],
    [['application/json'], undefined, ['application/json']],
    [['application/json'], [], ['application/json']],
    [undefined, ['text/csv'], ['text/csv']],
    [['application/json'], ['text/csv'], ['text/csv']],
    [['a', 'b'], ['c'], ['c']],
    [['a', 'b'], ['b'], ['b']],
    [['a'], ['b', 'c', 'b'], ['b', 'c']],
    [['a', 'a'], undefined, ['a']]
  ])('mergeAndUniq(%j, %j) returns %j', (a, b, expected) => {
    expect(mergeAndUniq(a, b)).toEqual(expected);
  });

  it('does not mutate its arguments', () => {
    const a = ['application/json'];
    const b = ['text/csv'];
    mergeAndUniq(a, b);
    expect(a).toEqual(['application/json']);
    expect(b).toEqual(['text/csv']);
  });
});

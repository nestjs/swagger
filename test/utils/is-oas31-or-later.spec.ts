import { isOas31OrLater } from '../../lib/utils/is-oas31-or-later.util';

describe('isOas31OrLater', () => {
  it.each([
    ['3.0.0', false],
    ['3.0.3', false],
    ['3.1.0', true],
    ['3.1.1', true],
    ['3.2.0', true],
    ['4.0.0', true]
  ])('returns %s for %s', (version, expected) => {
    expect(isOas31OrLater(version)).toBe(expected);
  });
});

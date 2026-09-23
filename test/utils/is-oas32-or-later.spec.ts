import { isOas32OrLater } from '../../lib/utils/is-oas32-or-later.util';

describe('isOas32OrLater', () => {
  it.each([
    ['3.0.0', false],
    ['3.0.3', false],
    ['3.1.0', false],
    ['3.1.1', false],
    ['3.2.0', true],
    ['3.3.0', true],
    ['4.0.0', true]
  ])('returns %s for %s', (version, expected) => {
    expect(isOas32OrLater(version)).toBe(expected);
  });
});

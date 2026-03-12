import { getEnumType, getEnumValues } from '../../lib/utils/enum.utils';

describe('enum.utils', () => {
  describe('getEnumType', () => {
    it('should return "string" for string enum values', () => {
      expect(getEnumType(['a', 'b'])).toBe('string');
    });

    it('should return "number" for number enum values', () => {
      expect(getEnumType([1, 2])).toBe('number');
    });

    it('should return "boolean" for boolean enum values', () => {
      expect(getEnumType([true, false])).toBe('boolean');
    });

    it('should return "boolean" for a single true value', () => {
      expect(getEnumType([true])).toBe('boolean');
    });

    it('should return "boolean" for a single false value', () => {
      expect(getEnumType([false])).toBe('boolean');
    });

    it('should return "string" for mixed string/number values', () => {
      expect(getEnumType(['a', 1])).toBe('string');
    });
  });

  describe('getEnumValues', () => {
    it('should pass through boolean arrays unchanged', () => {
      expect(getEnumValues([true, false])).toEqual([true, false]);
    });

    it('should pass through string arrays unchanged', () => {
      expect(getEnumValues(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('should pass through number arrays unchanged', () => {
      expect(getEnumValues([1, 2])).toEqual([1, 2]);
    });

    it('should resolve lazy enum types', () => {
      const lazyEnum = () => ['x', 'y'];
      expect(getEnumValues(lazyEnum)).toEqual(['x', 'y']);
    });

    it('should extract values from TypeScript numeric enum objects', () => {
      const numericEnum = { 0: 'A', 1: 'B', A: 0, B: 1 };
      expect(getEnumValues(numericEnum)).toEqual([0, 1]);
    });

    it('should extract values from TypeScript string enum objects', () => {
      const stringEnum = { A: 'alpha', B: 'beta' };
      expect(getEnumValues(stringEnum)).toEqual(['alpha', 'beta']);
    });
  });
});

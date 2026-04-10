import { normalizePackagePath } from '../../lib/plugin/utils/plugin-utils';

describe('normalizePackagePath', () => {
  it('should return relative paths without node_modules unchanged', () => {
    expect(normalizePackagePath('./cats/dto/create-cat.dto')).toBe(
      './cats/dto/create-cat.dto'
    );
  });

  it('should strip node_modules prefix for scoped workspace packages', () => {
    // Before the fix this would remain as the relative node_modules path,
    // causing TS error TS2742 when declaration files are emitted.
    expect(
      normalizePackagePath('../node_modules/@amk/utils/src/dto/order.dto')
    ).toBe('@amk/utils/src/dto/order.dto');
  });

  it('should strip node_modules prefix for unscoped packages', () => {
    expect(
      normalizePackagePath('../node_modules/some-lib/src/dto/foo.dto')
    ).toBe('some-lib/src/dto/foo.dto');
  });

  it('should strip @types prefix inside node_modules', () => {
    expect(
      normalizePackagePath('../node_modules/@types/express/index')
    ).toBe('express');
  });

  it('should strip /index suffix from package paths', () => {
    expect(
      normalizePackagePath('../node_modules/@org/product-warehouse/dist/index')
    ).toBe('@org/product-warehouse/dist');
  });

  it('should handle deeply nested node_modules paths', () => {
    expect(
      normalizePackagePath(
        '../../../node_modules/@amk/utils/src/enum/payment-method.enum'
      )
    ).toBe('@amk/utils/src/enum/payment-method.enum');
  });

  it('should handle paths where node_modules is not present (non-workspace local paths)', () => {
    expect(
      normalizePackagePath('../../../packages/product-warehouse/dist/index')
    ).toBe('../../../packages/product-warehouse/dist/index');
  });
});

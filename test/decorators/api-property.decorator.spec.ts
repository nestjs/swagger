import 'reflect-metadata';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';

describe('ApiProperty', () => {
  it('converts RegExp pattern to OpenAPI-compatible string (no slashes/flags)', () => {
    class DtoWithRegExp {
      @ApiProperty({ pattern: /^\w+$/gi })
      name!: string;
    }

    const meta = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      DtoWithRegExp.prototype,
      'name'
    );

    expect(meta.pattern).toBe('^\\w+$');
  });

  it('keeps string pattern as-is', () => {
    class DtoWithString {
      @ApiProperty({ pattern: '^[a-z0-9]+$' })
      alias!: string;
    }

    const meta = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      DtoWithString.prototype,
      'alias'
    );

    expect(meta.pattern).toBe('^[a-z0-9]+$');
  });

  it('supports RegExp created via constructor', () => {
    class DtoCtor {
      @ApiProperty({ pattern: new RegExp('^\\w+$', 'i') })
      v!: string;
    }
    const meta = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      DtoCtor.prototype,
      'v'
    );
    expect(meta.pattern).toBe('^\\w+$');
    expect(typeof meta.pattern).toBe('string');
  });

  it('preserves escaped slashes in the pattern body', () => {
    class DtoSlash {
      @ApiProperty({ pattern: /^a\/b$/ })
      p!: string;
    }
    const meta = Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES,
      DtoSlash.prototype,
      'p'
    );
    expect(meta.pattern).toBe('^a\\/b$');
  });

  it('does not mutate the original options object', () => {
    const opts = { pattern: /^\w+$/ };
    class DtoNoMutate {
      @ApiProperty(opts as any)
      m!: string;
    }
    expect(opts.pattern instanceof RegExp).toBe(true);
  });
});

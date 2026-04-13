import { stripDynamicDefaults } from '../../lib/utils/strip-dynamic-defaults.util';

describe('stripDynamicDefaults', () => {
  it('should remove Date instance defaults', () => {
    const schemas: any = {
      Plan: {
        type: 'object',
        properties: {
          createdAt: { type: 'string', format: 'date-time', default: new Date('2025-01-01') },
          name: { type: 'string', default: 'anonymous' }
        }
      }
    };

    stripDynamicDefaults(schemas);

    expect(schemas.Plan.properties.createdAt.default).toBeUndefined();
    expect(schemas.Plan.properties.name.default).toBe('anonymous');
  });

  it('should preserve primitive defaults', () => {
    const schemas: any = {
      Dto: {
        type: 'object',
        properties: {
          count: { type: 'number', default: 0 },
          enabled: { type: 'boolean', default: true },
          label: { type: 'string', default: 'hello' },
          nothing: { type: 'string', default: null }
        }
      }
    };

    stripDynamicDefaults(schemas);

    expect(schemas.Dto.properties.count.default).toBe(0);
    expect(schemas.Dto.properties.enabled.default).toBe(true);
    expect(schemas.Dto.properties.label.default).toBe('hello');
    expect(schemas.Dto.properties.nothing.default).toBeNull();
  });

  it('should preserve plain object and array defaults', () => {
    const schemas: any = {
      Dto: {
        type: 'object',
        properties: {
          config: { type: 'object', default: { key: 'value' } },
          tags: { type: 'array', default: ['a', 'b'] }
        }
      }
    };

    stripDynamicDefaults(schemas);

    expect(schemas.Dto.properties.config.default).toEqual({ key: 'value' });
    expect(schemas.Dto.properties.tags.default).toEqual(['a', 'b']);
  });

  it('should remove class instance defaults that are not Date', () => {
    class Foo {}
    const schemas: any = {
      Dto: {
        type: 'object',
        properties: {
          foo: { type: 'object', default: new Foo() }
        }
      }
    };

    stripDynamicDefaults(schemas);

    expect(schemas.Dto.properties.foo.default).toBeUndefined();
  });

  it('should strip defaults from nested allOf/oneOf/anyOf schemas', () => {
    const schemas: any = {
      Dto: {
        allOf: [
          {
            type: 'object',
            properties: {
              ts: { type: 'string', default: new Date() }
            }
          }
        ]
      }
    };

    stripDynamicDefaults(schemas);

    expect(schemas.Dto.allOf[0].properties.ts.default).toBeUndefined();
  });
});

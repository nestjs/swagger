import { rewriteNullableForOas31 } from '../../lib/utils/rewrite-nullable-for-oas31.util';

describe('rewriteNullableForOas31', () => {
  it('converts a scalar type plus nullable into a type union', () => {
    const schema: any = { type: 'string', nullable: true };

    rewriteNullableForOas31(schema);

    expect(schema).toEqual({ type: ['string', 'null'] });
    expect(schema.nullable).toBeUndefined();
  });

  it('appends null to an existing type array', () => {
    const schema: any = { type: ['string', 'number'], nullable: true };

    rewriteNullableForOas31(schema);

    expect(schema.type).toEqual(['string', 'number', 'null']);
  });

  it('rewrites nested property schemas', () => {
    const schemas: any = {
      User: {
        type: 'object',
        properties: {
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          name: { type: 'string' }
        }
      }
    };

    rewriteNullableForOas31(schemas);

    expect(schemas.User.properties.deletedAt).toEqual({
      type: ['string', 'null'],
      format: 'date-time'
    });
    expect(schemas.User.properties.name).toEqual({ type: 'string' });
  });

  it('represents a nullable $ref/allOf schema as oneOf with null', () => {
    const schema: any = {
      nullable: true,
      allOf: [{ $ref: '#/components/schemas/Profile' }]
    };

    rewriteNullableForOas31(schema);

    expect(schema).toEqual({
      oneOf: [
        { allOf: [{ $ref: '#/components/schemas/Profile' }] },
        { type: 'null' }
      ]
    });
  });

  it('leaves 3.0-compatible schemas without nullable unchanged', () => {
    const schema: any = { type: 'string' };

    rewriteNullableForOas31(schema);

    expect(schema).toEqual({ type: 'string' });
  });
});

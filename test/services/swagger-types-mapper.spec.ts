import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

describe('SwaggerTypesMapper', () => {
  let mapper: SwaggerTypesMapper;

  beforeEach(() => {
    mapper = new SwaggerTypesMapper();
  });

  describe('mapParamTypes', () => {
    it('should move `multipleOf` into the schema for type-based parameters', () => {
      const params = [
        {
          name: 'count',
          in: 'query',
          required: true,
          type: Number,
          multipleOf: 5
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).not.toHaveProperty('multipleOf');
      expect(result[0].schema).toEqual({
        type: 'number',
        multipleOf: 5
      });
    });

    it('should move `multipleOf` into the schema for array parameters', () => {
      const params = [
        {
          name: 'counts',
          in: 'query',
          required: true,
          type: Number,
          isArray: true,
          multipleOf: 5
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).not.toHaveProperty('multipleOf');
      expect(result[0].schema.type).toBe('array');
    });

    it('should move schema-only keywords into the schema and drop `readOnly` for type-based parameters', () => {
      const params = [
        {
          name: 'id',
          in: 'query',
          required: true,
          type: String,
          readOnly: true,
          writeOnly: false,
          xml: { name: 'id' },
          not: { enum: [''] },
          discriminator: { propertyName: 'kind' },
          externalDocs: { url: 'https://example.com/ids' }
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'id',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          writeOnly: false,
          xml: { name: 'id' },
          not: { enum: [''] },
          discriminator: { propertyName: 'kind' },
          externalDocs: { url: 'https://example.com/ids' }
        }
      });
    });

    it('should move schema-only keywords into an explicit parameter schema and drop `readOnly`', () => {
      const params = [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          readOnly: true,
          externalDocs: { url: 'https://example.com/ids' }
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'id',
        in: 'query',
        required: true,
        schema: {
          type: 'string',
          format: 'uuid',
          externalDocs: { url: 'https://example.com/ids' }
        }
      });
    });

    it('should not merge structural keywords like `not` into an explicit parameter schema', () => {
      const params = [
        {
          name: 'pet',
          in: 'query',
          required: true,
          schema: { $ref: '#/components/schemas/Pet' },
          not: { type: 'null' },
          discriminator: { propertyName: 'kind' }
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'pet',
        in: 'query',
        required: true,
        schema: { $ref: '#/components/schemas/Pet' }
      });
    });
  });
});

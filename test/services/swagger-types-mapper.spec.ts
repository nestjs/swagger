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

    it('should move schema-only keywords like `readOnly` into the schema for type-based parameters', () => {
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
          readOnly: true,
          writeOnly: false,
          xml: { name: 'id' },
          not: { enum: [''] },
          discriminator: { propertyName: 'kind' },
          externalDocs: { url: 'https://example.com/ids' }
        }
      });
    });

    it('should move schema-only keywords like `readOnly` into an explicit parameter schema', () => {
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
          readOnly: true,
          externalDocs: { url: 'https://example.com/ids' }
        }
      });
    });
  });
});

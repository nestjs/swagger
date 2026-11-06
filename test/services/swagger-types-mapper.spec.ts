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

    it('should move OpenAPI 3.1 schema keywords into the schema for type-based parameters', () => {
      const params = [
        {
          name: 'token',
          in: 'path',
          required: true,
          type: 'string',
          format: 'base64url',
          contentEncoding: 'base64url',
          contentMediaType: 'application/octet-stream',
          const: 'abc'
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'token',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'base64url',
          contentEncoding: 'base64url',
          contentMediaType: 'application/octet-stream',
          const: 'abc'
        }
      });
    });

    it('should move OpenAPI 3.1 schema keywords into an explicit parameter schema', () => {
      const params = [
        {
          name: 'token',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          contentEncoding: 'base64url'
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'token',
        in: 'path',
        required: true,
        schema: { type: 'string', contentEncoding: 'base64url' }
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

    it('should move string length constraints of array parameters to the items', () => {
      const params = [
        {
          name: 'tags',
          in: 'query',
          required: false,
          type: String,
          isArray: true,
          minLength: 2,
          maxLength: 5,
          maxItems: 3
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'tags',
        in: 'query',
        required: false,
        schema: {
          type: 'array',
          maxItems: 3,
          items: { type: 'string', minLength: 2, maxLength: 5 }
        }
      });
    });

    it.each([
      ['a format', { type: 'string', format: 'uuid' }],
      ['a reference', { $ref: '#/components/schemas/Foo' }]
    ])('should keep explicit array items with %s', (_, items) => {
      const params = [
        { name: 'ids', in: 'query', required: true, isArray: true, items }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'ids',
        in: 'query',
        required: true,
        schema: { type: 'array', items }
      });
    });

    it('should drop `exampleMaxDepth` from type-based parameters', () => {
      const params = [
        {
          name: 'tags',
          in: 'query',
          required: false,
          type: String,
          isArray: true,
          example: ['a'],
          exampleMaxDepth: 1
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'tags',
        in: 'query',
        required: false,
        schema: { type: 'array', items: { type: 'string' }, example: ['a'] }
      });
    });

    it('should drop `exampleMaxDepth` from parameters with an explicit schema', () => {
      const params = [
        {
          name: 'filter',
          in: 'query',
          required: true,
          schema: { type: 'object', example: { a: { b: 1 } } },
          exampleMaxDepth: 1
        }
      ];

      const result = mapper.mapParamTypes(params as any) as any[];

      expect(result[0]).toEqual({
        name: 'filter',
        in: 'query',
        required: true,
        schema: { type: 'object', example: { a: { b: 1 } } }
      });
    });
  });
});

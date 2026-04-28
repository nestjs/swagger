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
  });
});

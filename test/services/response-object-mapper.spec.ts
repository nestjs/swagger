import { ResponseObjectMapper } from '../../lib/services/response-object-mapper';

describe('ResponseObjectMapper', () => {
  let mapper: ResponseObjectMapper;

  beforeEach(() => {
    mapper = new ResponseObjectMapper();
  });

  const produces = ['application/json'];
  const schemaName = 'CatDto';
  const $ref = '#/components/schemas/CatDto';

  describe('toRefObject', () => {
    it('should produce a plain $ref schema when nullable is not set', () => {
      const result = mapper.toRefObject({ description: 'OK' }, schemaName, produces);
      expect(result.content['application/json'].schema).toEqual({ $ref });
    });

    it('should produce oneOf with null type when nullable: true', () => {
      const result = mapper.toRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result.content['application/json'].schema).toEqual({
        oneOf: [{ $ref }, { type: 'null' }]
      });
    });

    it('should not leak nullable into the response object', () => {
      const result = mapper.toRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result).not.toHaveProperty('nullable');
    });
  });

  describe('toArrayRefObject', () => {
    it('should produce an array schema when nullable is not set', () => {
      const result = mapper.toArrayRefObject({ description: 'OK' }, schemaName, produces);
      expect(result.content['application/json'].schema).toEqual({
        type: 'array',
        items: { $ref }
      });
    });

    it('should produce oneOf wrapping the array with null when nullable: true', () => {
      const result = mapper.toArrayRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result.content['application/json'].schema).toEqual({
        oneOf: [{ type: 'array', items: { $ref } }, { type: 'null' }]
      });
    });

    it('should not leak nullable into the response object', () => {
      const result = mapper.toArrayRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result).not.toHaveProperty('nullable');
    });
  });
});

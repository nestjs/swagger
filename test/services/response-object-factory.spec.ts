import { ResponseObjectFactory } from '../../lib/services/response-object-factory';

describe('ResponseObjectFactory', () => {
  let factory: ResponseObjectFactory;

  beforeEach(() => {
    factory = new ResponseObjectFactory();
  });

  const produces = ['application/json'];
  const factories = {
    linkName: () => 'link',
    operationId: () => 'op'
  };

  describe('built-in primitive type responses', () => {
    it('should preserve `example` when type is a built-in scalar', () => {
      const result = factory.create(
        { type: Number, description: 'OK', example: 42 } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result.content['application/json']).toEqual({
        schema: { type: 'number' },
        example: 42
      });
    });

    it('should preserve `examples` when type is a built-in scalar', () => {
      const examples = {
        first: { summary: 'First', value: 1 },
        second: { summary: 'Second', value: 2 }
      };
      const result = factory.create(
        { type: Number, description: 'OK', examples } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result.content['application/json']).toEqual({
        schema: { type: 'number' },
        examples
      });
    });

    it('should preserve `example` when type is a built-in scalar with isArray', () => {
      const result = factory.create(
        { type: Number, isArray: true, description: 'OK', example: [1, 2, 3] } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result.content['application/json']).toEqual({
        schema: { type: 'array', items: { type: 'number' } },
        example: [1, 2, 3]
      });
    });

    it('should not leak example into the top-level response object', () => {
      const result = factory.create(
        { type: String, description: 'OK', example: 'hello' } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result).not.toHaveProperty('example');
      expect(result).not.toHaveProperty('examples');
    });
  });
});

import { ResponseObjectMapper } from '../../lib/services/response-object-mapper';
import { convertNullableToOas31 } from '../../lib/utils/nullable-to-oas31.util';
import { OpenAPIObject } from '../../lib/interfaces/open-api-spec.interface';

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

    it('should wrap the $ref in the 3.0 nullable spelling when nullable: true', () => {
      const result = mapper.toRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result.content['application/json'].schema).toEqual({
        nullable: true,
        type: 'object',
        allOf: [{ $ref }]
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

    it('should mark a nullable array response with the keyword', () => {
      const result = mapper.toArrayRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(result.content['application/json'].schema).toEqual({
        type: 'array',
        items: { $ref },
        nullable: true
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

  // The mapper always emits the 3.0 spelling; documents that declare 3.1 are
  // normalized once, on the finished document, by convertNullableToOas31.
  describe('once normalized for an OpenAPI 3.1 document', () => {
    function normalize(response: Record<string, any>) {
      const document = {
        openapi: '3.1.0',
        info: { title: 'test', version: '1.0.0' },
        paths: { '/cats': { get: { responses: { '200': response } } } }
      } as unknown as OpenAPIObject;
      convertNullableToOas31(document);
      return (document.paths as any)['/cats'].get.responses['200'].content[
        'application/json'
      ].schema;
    }

    it('should turn a nullable $ref response into an anyOf union', () => {
      const response = mapper.toRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(normalize(response)).toEqual({
        anyOf: [{ $ref }, { type: 'null' }]
      });
    });

    it('should turn a nullable array response into a type union', () => {
      const response = mapper.toArrayRefObject(
        { description: 'OK', nullable: true },
        schemaName,
        produces
      );
      expect(normalize(response)).toEqual({
        type: ['array', 'null'],
        items: { $ref }
      });
    });
  });
});

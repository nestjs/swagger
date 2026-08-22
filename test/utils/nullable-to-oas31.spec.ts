import { convertNullableToOas31 } from '../../lib/utils/nullable-to-oas31.util';
import { OpenAPIObject } from '../../lib/interfaces/open-api-spec.interface';

function documentWith(schemas: Record<string, any>): OpenAPIObject {
  return {
    openapi: '3.1.0',
    info: { title: 'test', version: '1.0.0' },
    paths: {},
    components: { schemas }
  } as OpenAPIObject;
}

function convertSchema(schema: Record<string, any>) {
  const document = documentWith({ Test: schema });
  convertNullableToOas31(document);
  return document.components!.schemas!.Test as Record<string, any>;
}

describe('convertNullableToOas31', () => {
  describe('type unions', () => {
    it('turns a nullable primitive into a type union', () => {
      expect(convertSchema({ type: 'string', nullable: true })).toEqual({
        type: ['string', 'null']
      });
    });

    it('appends "null" to an existing type array', () => {
      expect(convertSchema({ type: ['string'], nullable: true })).toEqual({
        type: ['string', 'null']
      });
    });

    it('does not duplicate "null" when it is already listed', () => {
      expect(
        convertSchema({ type: ['string', 'null'], nullable: true })
      ).toEqual({
        type: ['string', 'null']
      });
    });

    it('preserves sibling keywords', () => {
      expect(
        convertSchema({
          type: 'string',
          format: 'date-time',
          description: 'when the user was deleted',
          nullable: true
        })
      ).toEqual({
        type: ['string', 'null'],
        format: 'date-time',
        description: 'when the user was deleted'
      });
    });

    it('converts nullable arrays without touching the items schema', () => {
      expect(
        convertSchema({
          type: 'array',
          nullable: true,
          items: { type: 'string' }
        })
      ).toEqual({
        type: ['array', 'null'],
        items: { type: 'string' }
      });
    });
  });

  describe('enums', () => {
    it('adds null to the enum values', () => {
      expect(
        convertSchema({ type: 'string', enum: ['a', 'b'], nullable: true })
      ).toEqual({
        type: ['string', 'null'],
        enum: ['a', 'b', null]
      });
    });

    it('does not duplicate a null enum value', () => {
      expect(
        convertSchema({ type: 'string', enum: ['a', null], nullable: true })
      ).toEqual({
        type: ['string', 'null'],
        enum: ['a', null]
      });
    });

    it('adds null to an enum that declares no type', () => {
      expect(convertSchema({ enum: ['a'], nullable: true })).toEqual({
        enum: ['a', null]
      });
    });

    it('leaves the enum alone when the schema is not nullable', () => {
      expect(
        convertSchema({ type: 'string', enum: ['a'], nullable: false })
      ).toEqual({
        type: 'string',
        enum: ['a']
      });
    });
  });

  describe('references and composite schemas', () => {
    it('turns a nullable $ref into an anyOf union', () => {
      expect(
        convertSchema({ $ref: '#/components/schemas/Cat', nullable: true })
      ).toEqual({
        anyOf: [{ $ref: '#/components/schemas/Cat' }, { type: 'null' }]
      });
    });

    it('unwraps the 3.0 allOf wrapper emitted for nullable references', () => {
      expect(
        convertSchema({
          description: 'the owner',
          nullable: true,
          type: 'object',
          allOf: [{ $ref: '#/components/schemas/Cat' }]
        })
      ).toEqual({
        description: 'the owner',
        anyOf: [{ $ref: '#/components/schemas/Cat' }, { type: 'null' }]
      });
    });

    it('keeps multi-member combinators intact inside the union', () => {
      expect(
        convertSchema({
          nullable: true,
          oneOf: [{ type: 'string' }, { type: 'number' }]
        })
      ).toEqual({
        anyOf: [
          { oneOf: [{ type: 'string' }, { type: 'number' }] },
          { type: 'null' }
        ]
      });
    });

    it('keeps sibling keywords outside the union', () => {
      expect(
        convertSchema({
          title: 'Owner',
          deprecated: true,
          nullable: true,
          allOf: [{ $ref: '#/components/schemas/Cat' }, { type: 'object' }]
        })
      ).toEqual({
        title: 'Owner',
        deprecated: true,
        anyOf: [
          {
            allOf: [{ $ref: '#/components/schemas/Cat' }, { type: 'object' }]
          },
          { type: 'null' }
        ]
      });
    });
  });

  describe('untyped and non-nullable schemas', () => {
    it('drops a nullable keyword that asserts nothing', () => {
      expect(convertSchema({ description: 'anything', nullable: true })).toEqual(
        {
          description: 'anything'
        }
      );
    });

    it('drops nullable: false without other changes', () => {
      expect(convertSchema({ type: 'string', nullable: false })).toEqual({
        type: 'string'
      });
    });

    it('leaves a plain $ref untouched', () => {
      expect(convertSchema({ $ref: '#/components/schemas/Cat' })).toEqual({
        $ref: '#/components/schemas/Cat'
      });
    });
  });

  describe('nested positions', () => {
    it('converts nested properties, items and additionalProperties', () => {
      expect(
        convertSchema({
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string', nullable: true }
            },
            meta: {
              type: 'object',
              additionalProperties: { type: 'number', nullable: true }
            },
            patterned: {
              type: 'object',
              patternProperties: {
                '^x-': { type: 'string', nullable: true }
              }
            }
          }
        })
      ).toEqual({
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          meta: {
            type: 'object',
            additionalProperties: { type: ['number', 'null'] }
          },
          patterned: {
            type: 'object',
            patternProperties: {
              '^x-': { type: ['string', 'null'] }
            }
          }
        }
      });
    });

    it('converts schemas nested inside combinators and "not"', () => {
      expect(
        convertSchema({
          allOf: [{ type: 'string', nullable: true }],
          not: { type: 'number', nullable: true }
        })
      ).toEqual({
        allOf: [{ type: ['string', 'null'] }],
        not: { type: ['number', 'null'] }
      });
    });

    it('does not treat a property named "nullable" as the keyword', () => {
      expect(
        convertSchema({
          type: 'object',
          properties: {
            nullable: { type: 'boolean' }
          }
        })
      ).toEqual({
        type: 'object',
        properties: {
          nullable: { type: 'boolean' }
        }
      });
    });

    it('leaves example and default values untouched', () => {
      expect(
        convertSchema({
          type: 'object',
          nullable: true,
          default: { nullable: true },
          example: { nested: { nullable: true } }
        })
      ).toEqual({
        type: ['object', 'null'],
        default: { nullable: true },
        example: { nested: { nullable: true } }
      });
    });

    it('is idempotent', () => {
      const document = documentWith({
        Test: { type: 'string', enum: ['a'], nullable: true }
      });
      convertNullableToOas31(document);
      const afterFirstPass = JSON.parse(JSON.stringify(document));
      convertNullableToOas31(document);
      expect(document).toEqual(afterFirstPass);
    });
  });

  describe('document positions outside components.schemas', () => {
    it('converts parameters, request bodies, responses and headers', () => {
      const document = {
        openapi: '3.1.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {
          '/cats': {
            parameters: [
              { name: 'shared', in: 'query', schema: { type: 'string', nullable: true } }
            ],
            get: {
              parameters: [
                { name: 'limit', in: 'query', schema: { type: 'number', nullable: true } }
              ],
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'string', nullable: true }
                  }
                }
              },
              responses: {
                '200': {
                  description: '',
                  headers: {
                    'x-total': { schema: { type: 'number', nullable: true } }
                  },
                  content: {
                    'application/json': {
                      schema: { type: 'string', nullable: true }
                    }
                  }
                }
              },
              callbacks: {
                onEvent: {
                  '{$request.body#/url}': {
                    post: {
                      responses: {
                        '200': {
                          description: '',
                          content: {
                            'application/json': {
                              schema: { type: 'string', nullable: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        webhooks: {
          newCat: {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        },
        components: {
          parameters: {
            Shared: { name: 'shared', in: 'query', schema: { type: 'string', nullable: true } }
          },
          requestBodies: {
            Body: {
              content: { 'application/json': { schema: { type: 'string', nullable: true } } }
            }
          },
          responses: {
            Res: {
              description: '',
              content: { 'application/json': { schema: { type: 'string', nullable: true } } }
            }
          },
          headers: {
            Header: { schema: { type: 'string', nullable: true } }
          }
        }
      } as unknown as OpenAPIObject;

      convertNullableToOas31(document);

      expect(JSON.stringify(document)).not.toContain('nullable');
      expect(JSON.stringify(document).match(/\["string","null"\]|\["number","null"\]/g)).toHaveLength(
        11
      );
    });
  });
});

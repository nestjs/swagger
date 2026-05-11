import { ApiProperty } from '../../lib/decorators';
import { SchemaObject } from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { applyExampleMaxDepth } from '../../lib/utils/apply-example-max-depth.util';

describe('applyExampleMaxDepth', () => {
  describe('global option', () => {
    it('truncates deeply nested object examples to {}/[] beyond the limit', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              example: {
                a: 1,
                b: { c: { d: { e: 'too deep' } } }
              }
            }
          }
        }
      };

      applyExampleMaxDepth(schemas, 2);

      // root container (depth 1) + one nested level (depth 2) survive,
      // anything below collapses to a placeholder of the matching shape.
      expect(schemas.Dto.properties!.payload['example']).toEqual({
        a: 1,
        b: { c: {} }
      });
    });

    it('treats arrays the same as objects when measuring depth', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              example: [{ id: 1, nested: { deep: 'cut' } }]
            }
          }
        }
      };

      applyExampleMaxDepth(schemas, 2);

      // depth 1 = array root, depth 2 = element object — children collapse.
      expect(schemas.Dto.properties!.list['example']).toEqual([
        { id: 1, nested: {} }
      ]);
    });

    it('leaves primitive examples untouched at any depth', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            label: { type: 'string', example: 'hello' },
            count: { type: 'number', example: 0 },
            active: { type: 'boolean', example: false },
            nothing: { type: 'string', example: null }
          }
        }
      };

      applyExampleMaxDepth(schemas, 0);

      expect(schemas.Dto.properties!.label['example']).toBe('hello');
      expect(schemas.Dto.properties!.count['example']).toBe(0);
      expect(schemas.Dto.properties!.active['example']).toBe(false);
      expect(schemas.Dto.properties!.nothing['example']).toBeNull();
    });

    it('collapses any non-primitive example to {} or [] when maxDepth is 0', () => {
      const schemas: Record<string, SchemaObject> = {
        Obj: {
          type: 'object',
          example: { a: 1 }
        },
        Arr: {
          type: 'array',
          example: [1, 2, 3]
        }
      };

      applyExampleMaxDepth(schemas, 0);

      expect(schemas.Obj['example']).toEqual({});
      expect(schemas.Arr['example']).toEqual([]);
    });

    it('truncates entries inside the OpenAPI 3.1 examples array', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              examples: [
                { a: { b: { c: 'cut' } } },
                { x: { y: { z: 'cut' } } }
              ]
            }
          }
        }
      };

      applyExampleMaxDepth(schemas, 2);

      expect(schemas.Dto.properties!.payload['examples']).toEqual([
        { a: { b: {} } },
        { x: { y: {} } }
      ]);
    });

    it('walks into items, allOf, oneOf, anyOf, and additionalProperties', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            arr: {
              type: 'array',
              items: {
                type: 'object',
                example: { lvl1: { lvl2: 'cut' } }
              }
            },
            combo: {
              allOf: [
                { type: 'object', example: { a: { b: 'cut' } } }
              ],
              oneOf: [
                { type: 'object', example: { a: { b: 'cut' } } }
              ],
              anyOf: [
                { type: 'object', example: { a: { b: 'cut' } } }
              ]
            } as any,
            map: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                example: { a: { b: 'cut' } }
              }
            }
          }
        }
      };

      applyExampleMaxDepth(schemas, 1);

      expect(
        schemas.Dto.properties!.arr['items']['example']
      ).toEqual({ lvl1: {} });
      expect(
        schemas.Dto.properties!.combo['allOf'][0].example
      ).toEqual({ a: {} });
      expect(
        schemas.Dto.properties!.combo['oneOf'][0].example
      ).toEqual({ a: {} });
      expect(
        schemas.Dto.properties!.combo['anyOf'][0].example
      ).toEqual({ a: {} });
      expect(
        schemas.Dto.properties!.map['additionalProperties'].example
      ).toEqual({ a: {} });
    });
  });

  describe('per-property override', () => {
    it('overrides the global limit with the per-property exampleMaxDepth value', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            tight: {
              type: 'object',
              exampleMaxDepth: 1,
              example: { a: { b: 'cut even though global is generous' } }
            } as any,
            loose: {
              type: 'object',
              example: { a: { b: { c: 'kept up to global=3' } } }
            }
          }
        }
      };

      applyExampleMaxDepth(schemas, 3);

      expect(schemas.Dto.properties!.tight['example']).toEqual({ a: {} });
      expect(schemas.Dto.properties!.loose['example']).toEqual({
        a: { b: { c: 'kept up to global=3' } }
      });
    });

    it('applies the override even when the global option is unset', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          exampleMaxDepth: 1,
          example: { a: { b: 'cut' } }
        } as any
      };

      applyExampleMaxDepth(schemas, undefined);

      expect(schemas.Dto['example']).toEqual({ a: {} });
    });

    it('does not cascade the override to children of the matching schema', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          exampleMaxDepth: 1,
          properties: {
            inner: {
              type: 'object',
              example: { a: { b: { c: 'should follow global, not parent override' } } }
            }
          }
        } as any
      };

      applyExampleMaxDepth(schemas, 3);

      expect(schemas.Dto.properties!.inner['example']).toEqual({
        a: { b: { c: 'should follow global, not parent override' } }
      });
    });
  });

  describe('output leakage', () => {
    it('strips exampleMaxDepth from every visited schema', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          exampleMaxDepth: 2,
          properties: {
            inner: {
              type: 'object',
              exampleMaxDepth: 5,
              example: { ok: true }
            } as any,
            list: {
              type: 'array',
              items: {
                type: 'object',
                exampleMaxDepth: 1,
                example: { a: { b: 'cut' } }
              } as any
            }
          }
        } as any
      };

      applyExampleMaxDepth(schemas, undefined);

      const serialized = JSON.stringify(schemas);
      expect(serialized).not.toContain('exampleMaxDepth');
    });

    it('strips the metadata even when the override never triggers truncation', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          exampleMaxDepth: 5
        } as any
      };

      applyExampleMaxDepth(schemas, undefined);

      expect('exampleMaxDepth' in schemas.Dto).toBe(false);
    });
  });

  describe('no-op safety', () => {
    it('does not modify schemas when neither the global option nor any override is set', () => {
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              example: { a: { b: { c: { d: 'kept' } } } }
            },
            list: {
              type: 'array',
              example: [{ deeply: { nested: 'kept' } }]
            }
          }
        }
      };
      const before = JSON.stringify(schemas);

      applyExampleMaxDepth(schemas, undefined);

      expect(JSON.stringify(schemas)).toBe(before);
    });
  });

  describe('shared references (non-cyclic DAG)', () => {
    it('trims every occurrence when sibling properties share a reference', () => {
      const shared = { x: 1, y: { deeper: 'kept' } };
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          example: { a: shared, b: shared }
        } as any
      };

      applyExampleMaxDepth(schemas, 5);

      // Both occurrences are non-cyclic; the second must not be collapsed
      // because of the first one's traversal.
      expect(schemas.Dto['example']).toEqual({
        a: { x: 1, y: { deeper: 'kept' } },
        b: { x: 1, y: { deeper: 'kept' } }
      });
    });

    it('does not collapse repeated references inside an array', () => {
      const shared = { id: 7 };
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          example: [shared, shared, shared]
        } as any
      };

      applyExampleMaxDepth(schemas, 3);

      expect(schemas.Dto['example']).toEqual([
        { id: 7 },
        { id: 7 },
        { id: 7 }
      ]);
    });
  });

  describe('non-plain object instances', () => {
    it('preserves Date / Map / Set / class instances inside examples as-is', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      const map = new Map<string, number>([['k', 1]]);
      const set = new Set<number>([1, 2, 3]);
      class Custom {
        constructor(public name = 'foo') {}
      }
      const instance = new Custom();

      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          example: { ts: date, lookup: map, members: set, who: instance }
        } as any
      };

      applyExampleMaxDepth(schemas, 5);

      const out = schemas.Dto['example'] as Record<string, unknown>;
      expect(out.ts).toBe(date);
      expect(out.lookup).toBe(map);
      expect(out.members).toBe(set);
      expect(out.who).toBe(instance);
    });

    it('does not rewrite a Date used as the entire example value', () => {
      const date = new Date('2026-05-08T00:00:00.000Z');
      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'string',
          example: date
        } as any
      };

      applyExampleMaxDepth(schemas, 0);

      expect(schemas.Dto['example']).toBe(date);
    });
  });

  describe('circular safety', () => {
    it('terminates on circular example values via WeakSet guard', () => {
      const cyclic: Record<string, unknown> = { name: 'root' };
      cyclic.self = cyclic;

      const schemas: Record<string, SchemaObject> = {
        Dto: {
          type: 'object',
          example: cyclic
        }
      };

      expect(() => applyExampleMaxDepth(schemas, 5)).not.toThrow();

      const trimmed = schemas.Dto['example'] as Record<string, unknown>;
      expect(trimmed.name).toBe('root');
      // Cycle is replaced by a placeholder of the same shape (object → {}).
      expect(trimmed.self).toEqual({});
    });
  });

  describe('integration with SchemaObjectFactory output', () => {
    let schemaObjectFactory: SchemaObjectFactory;

    beforeEach(() => {
      schemaObjectFactory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
    });

    it('truncates a user-supplied @ApiProperty example end-to-end', () => {
      const big = {
        list: Array.from({ length: 5 }, (_, i) => ({
          id: i,
          nested: { a: 1, b: 2, c: { x: 'y' } }
        }))
      };
      class WithExample {
        @ApiProperty({ example: big })
        payload: object;
      }

      const schemas: Record<string, SchemaObject> = {};
      schemaObjectFactory.exploreModelSchema(WithExample, schemas);

      const before = JSON.stringify(schemas).length;
      applyExampleMaxDepth(schemas, 2);
      const after = JSON.stringify(schemas).length;

      // root object (depth 1) + list array (depth 2) survive; each element is
      // collapsed because it sits at depth 3.
      expect(after).toBeLessThan(before);
      expect(schemas.WithExample.properties!.payload['example']).toEqual({
        list: [{}, {}, {}, {}, {}]
      });
    });

    it('honours per-property @ApiProperty({ exampleMaxDepth }) and strips it from the schema', () => {
      class Dto {
        @ApiProperty({
          exampleMaxDepth: 1,
          example: { a: { b: 'cut' } }
        } as any)
        bounded: object;

        @ApiProperty({
          example: { a: { b: 'kept' } }
        })
        unbounded: object;
      }

      const schemas: Record<string, SchemaObject> = {};
      schemaObjectFactory.exploreModelSchema(Dto, schemas);
      applyExampleMaxDepth(schemas, undefined);

      expect(
        schemas.Dto.properties!.bounded['example']
      ).toEqual({ a: {} });
      expect(
        schemas.Dto.properties!.unbounded['example']
      ).toEqual({ a: { b: 'kept' } });
      expect(JSON.stringify(schemas)).not.toContain('exampleMaxDepth');
    });
  });
});

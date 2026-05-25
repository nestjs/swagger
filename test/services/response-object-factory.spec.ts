import { ApiResponse } from '../../lib/decorators';
import {
  ReferenceObject,
  SchemaObject
} from '../../lib/interfaces/open-api-spec.interface';
import { ResponseObjectFactory } from '../../lib/services/response-object-factory';
import type { BaseIssue, BaseSchema } from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import { z, type ZodType } from 'zod';
import { createSchema } from 'zod-openapi';

describe('ResponseObjectFactory', () => {
  let factory: ResponseObjectFactory;

  beforeEach(() => {
    factory = new ResponseObjectFactory(testStandardSchemaConverter);
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

    it('should wrap built-in scalar in oneOf with type: null when nullable: true', () => {
      const result = factory.create(
        { type: String, description: 'OK', nullable: true } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result).not.toHaveProperty('nullable');
      expect(result.content['application/json']).toEqual({
        schema: { oneOf: [{ type: 'string' }, { type: 'null' }] }
      });
    });

    it('should wrap built-in scalar array in oneOf with type: null when nullable: true', () => {
      const result = factory.create(
        { type: Number, isArray: true, description: 'OK', nullable: true } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result).not.toHaveProperty('nullable');
      expect(result.content['application/json']).toEqual({
        schema: {
          oneOf: [
            { type: 'array', items: { type: 'number' } },
            { type: 'null' }
          ]
        }
      });
    });

    it('should preserve example alongside nullable for built-in scalar', () => {
      const result = factory.create(
        {
          type: String,
          description: 'OK',
          nullable: true,
          example: 'hello'
        } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result).not.toHaveProperty('nullable');
      expect(result).not.toHaveProperty('example');
      expect(result.content['application/json']).toEqual({
        schema: { oneOf: [{ type: 'string' }, { type: 'null' }] },
        example: 'hello'
      });
    });

    it('should use a standard schema response override instead of the inferred type', () => {
      const schemas = {};
      const result = factory.create(
        {
          type: Number,
          description: 'OK',
          standardSchema: z.object({
            status: z.enum(['available', 'resting']).meta({
              description: 'Response status enum from Zod',
              example: 'available'
            }),
            result: z
              .union([
                z.string().email(),
                z.object({
                  message: z.string().meta({
                    description: 'Returned message from Zod',
                    example: 'No cat available'
                  })
                })
              ])
              .meta({ description: 'Response union from Zod' })
          })
        } as any,
        produces,
        schemas,
        factories
      ) as any;

      expect(result.content['application/json'].schema).toEqual(
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            status: {
              type: 'string',
              enum: ['available', 'resting'],
              description: 'Response status enum from Zod',
              example: 'available'
            },
            result: expect.objectContaining({
              description: 'Response union from Zod'
            })
          })
        })
      );
      expect(result.content['application/json'].schema.type).toBe('object');
      expect(result.content['application/json'].schema).not.toEqual({
        type: 'number'
      });
    });

    it('should preserve a standardSchema passed through ApiResponse metadata', () => {
      class Controller {
        @ApiResponse({
          status: 200,
          standardSchema: z.object({
            status: z.enum(['available', 'resting']).meta({
              description: 'Response status enum from Zod',
              example: 'available'
            })
          })
        })
        handler() {}
      }

      const metadata = Reflect.getMetadata(
        'swagger/apiResponse',
        Controller.prototype.handler
      );

      expect(metadata[200].type).toBeUndefined();
      expect(metadata[200].standardSchema).toBeDefined();
      expect((metadata[200].standardSchema as any)['~standard']?.vendor).toBe(
        'zod'
      );
    });

    it('should keep raw OpenAPI response schemas untouched', () => {
      const result = factory.create(
        {
          description: 'OK',
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string'
              }
            }
          }
        } as any,
        produces,
        {},
        factories
      ) as any;

      expect(result.content['application/json'].schema).toEqual({
        type: 'object',
        properties: {
          message: {
            type: 'string'
          }
        }
      });
    });
  });
});

const testStandardSchemaConverter = (schema: unknown, { schemaType }: any) => {
  if (isZodStandardSchema(schema)) {
    const converted = createSchema(schema, {
      io: schemaType,
      openapiVersion: '3.0.0'
    });
    return {
      schema: converted.schema as SchemaObject | ReferenceObject,
      components: converted.components as unknown as Record<string, SchemaObject>
    };
  }

  if (isValibotStandardSchema(schema)) {
    return {
      schema: toJsonSchema(schema, {
        target: 'openapi-3.0',
        typeMode: schemaType
      }) as unknown as SchemaObject | ReferenceObject
    };
  }

  return undefined;
};

type ValibotSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;

function hasVendor(schema: unknown, vendor: string) {
  return (
    !!schema &&
    typeof schema === 'object' &&
    (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor ===
      vendor
  );
}

function isZodStandardSchema(schema: unknown): schema is ZodType {
  return hasVendor(schema, 'zod');
}

function isValibotStandardSchema(schema: unknown): schema is ValibotSchema {
  return hasVendor(schema, 'valibot');
}

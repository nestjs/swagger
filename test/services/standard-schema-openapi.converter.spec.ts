import * as v from 'valibot';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';
import { toJsonSchema } from '@valibot/to-json-schema';
import { StandardSchemaConverter } from '../../lib/interfaces';
import {
  ReferenceObject,
  SchemaObject
} from '../../lib/interfaces/open-api-spec.interface';
import { StandardSchemaOpenApiConverter } from '../../lib/services/standard-schema-openapi.converter';

describe('StandardSchemaOpenApiConverter', () => {
  const converter = new StandardSchemaOpenApiConverter(
    testStandardSchemaConverter
  );

  it('should convert a standard jsonSchema hook and rewrite component refs', () => {
    const converted = converter.convert({
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: unknown) => ({ value }),
        jsonSchema: {
          input: () => ({
            type: 'object',
            properties: {
              tag: { $ref: '#/$defs/Tag' }
            },
            required: ['tag'],
            $defs: {
              Tag: {
                type: 'object',
                properties: {
                  label: { type: 'string' }
                },
                required: ['label']
              }
            }
          })
        }
      }
    });

    expect(converted).toEqual({
      schema: {
        type: 'object',
        properties: {
          tag: { $ref: '#/components/schemas/Tag' }
        },
        required: ['tag']
      },
      components: {
        Tag: {
          type: 'object',
          properties: {
            label: { type: 'string' }
          },
          required: ['label']
        }
      }
    });
  });

  it('should convert zod standard schemas', () => {
    const converted = converter.convert(
      z.object({
        id: z.string(),
        tags: z.array(z.number())
      }),
      'input'
    );

    expect(converted?.schema).toEqual(
      expect.objectContaining({
        type: 'object',
        properties: {
          id: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'number' }
          }
        },
        required: ['id', 'tags']
      })
    );
  });

  it('should preserve OpenAPI-specific metadata from zod conversion', () => {
    const converted = converter.convert(
      z.object({
        name: z.string().meta({
          description: 'cat name',
          example: 'Milo'
        })
      }),
      'input'
    );

    expect(converted?.schema).toEqual(
      expect.objectContaining({
        properties: {
          name: {
            type: 'string',
            description: 'cat name',
            example: 'Milo'
          }
        }
      })
    );
  });

  it('should convert zod unions, enums, and nested OpenAPI metadata', () => {
    const converted = converter.convert(
      z.object({
        species: z.enum(['cat', 'dog']).meta({
          title: 'Species',
          description: 'Species enum from Zod',
          example: 'cat'
        }),
        contact: z
          .union([
            z.string().email(),
            z.object({
              phone: z.string().meta({
                description: 'Phone number from Zod',
                example: '123-456'
              })
            })
          ])
          .meta({
            title: 'PreferredContact',
            description: 'Preferred contact from Zod',
            examples: ['owner@example.com']
          }),
        profile: z
          .object({
            nickname: z.string().meta({
              description: 'Nested nickname from Zod',
              example: 'Captain Whiskers'
            }),
            notes: z.string().default('Indoor only').meta({
              description: 'Nested notes from Zod',
              example: 'Indoor only',
              deprecated: true
            })
          })
          .meta({
            title: 'CatProfile',
            description: 'Nested cat profile from Zod'
          })
      }),
      'input'
    );

    expect(converted?.schema).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({
          species: {
            type: 'string',
            enum: ['cat', 'dog'],
            title: 'Species',
            description: 'Species enum from Zod',
            example: 'cat'
          },
          contact: expect.objectContaining({
            title: 'PreferredContact',
            description: 'Preferred contact from Zod'
          }),
          profile: expect.objectContaining({
            title: 'CatProfile',
            description: 'Nested cat profile from Zod',
            properties: expect.objectContaining({
              nickname: {
                type: 'string',
                description: 'Nested nickname from Zod',
                example: 'Captain Whiskers'
              },
              notes: expect.objectContaining({
                type: 'string',
                default: 'Indoor only',
                description: 'Nested notes from Zod',
                example: 'Indoor only',
                deprecated: true
              })
            })
          })
        })
      })
    );

    const unionBranches =
      (converted?.schema as any).properties.contact.anyOf ??
      (converted?.schema as any).properties.contact.oneOf;
    expect(unionBranches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'string', format: 'email' }),
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            phone: {
              type: 'string',
              description: 'Phone number from Zod',
              example: '123-456'
            }
          })
        })
      ])
    );
    expect((converted?.schema as any).properties.contact.example).toBe(
      'owner@example.com'
    );
    expect((converted?.schema as any).properties.contact.examples).toBeUndefined();
  });

  it('should convert valibot standard schemas', () => {
    const converted = converter.convert(
      v.object({
        page: v.number(),
        search: v.optional(v.string())
      }),
      'input'
    );

    expect(converted?.schema).toEqual({
      type: 'object',
      properties: {
        page: { type: 'number' },
        search: { type: 'string' }
      },
      required: ['page']
    });
  });

  it('should preserve OpenAPI-specific metadata from valibot conversion', () => {
    const converted = converter.convert(
      v.object({
        name: v.pipe(v.string(), v.description('cat name')),
        search: v.pipe(v.optional(v.string()), v.title('Search term'))
      }),
      'input'
    );

    expect(converted?.schema).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'cat name' },
        search: { type: 'string', title: 'Search term' }
      },
      required: ['name']
    });
  });

  it('should convert valibot unions, enums, and nested metadata', () => {
    const converted = converter.convert(
      v.object({
        mode: v.pipe(
          v.picklist(['simple', 'advanced']),
          v.description('Mode enum from Valibot'),
          v.examples(['simple'])
        ),
        filter: v.pipe(
          v.union([
            v.string(),
            v.object({
              nested: v.pipe(
                v.string(),
                v.description('Nested filter from Valibot'),
                v.examples(['persian'])
              )
            })
          ]),
          v.title('FilterTitle'),
          v.description('Filter union from Valibot')
        ),
        details: v.pipe(
          v.object({
            label: v.pipe(
              v.string(),
              v.description('Nested label from Valibot'),
              v.examples(['primary'])
            ),
            flags: v.pipe(v.array(v.boolean()), v.title('Flag list from Valibot'))
          }),
          v.title('Details title from Valibot'),
          v.description('Nested details from Valibot')
        )
      }),
      'input'
    );

    expect(converted?.schema).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({
          mode: expect.objectContaining({
            type: 'string',
            enum: ['simple', 'advanced'],
            description: 'Mode enum from Valibot'
          }),
          filter: expect.objectContaining({
            title: 'FilterTitle',
            description: 'Filter union from Valibot'
          }),
          details: expect.objectContaining({
            title: 'Details title from Valibot',
            description: 'Nested details from Valibot',
            properties: expect.objectContaining({
              label: expect.objectContaining({
                type: 'string',
                description: 'Nested label from Valibot'
              }),
              flags: expect.objectContaining({
                type: 'array',
                title: 'Flag list from Valibot'
              })
            })
          })
        })
      })
    );

    const filterBranches =
      (converted?.schema as any).properties.filter.anyOf ??
      (converted?.schema as any).properties.filter.oneOf;
    expect(filterBranches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'string' }),
        expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            nested: expect.objectContaining({
              type: 'string',
              description: 'Nested filter from Valibot'
            })
          })
        })
      ])
    );
    expect((converted?.schema as any).properties.mode.example).toBe('simple');
    expect((converted?.schema as any).properties.mode.examples).toBeUndefined();
    expect(
      (converted?.schema as any).properties.details.properties.label.example
    ).toBe('primary');
    expect(
      (converted?.schema as any).properties.details.properties.label.examples
    ).toBeUndefined();
  });

  it('should return undefined when a standard schema cannot be converted', () => {
    expect(
      converter.convert({
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value: unknown) => ({ value })
        }
      })
    ).toBeUndefined();
  });

  it('should normalize const to enum for OpenAPI 3.0 compatibility', () => {
    const converted = converter.convert(
      z.object({
        kind: z.literal('cat')
      }),
      'input'
    );

    expect(converted?.schema).toEqual(
      expect.objectContaining({
        properties: {
          kind: {
            type: 'string',
            enum: ['cat']
          }
        }
      })
    );
    expect((converted?.schema as any).properties.kind.const).toBeUndefined();
  });
});

const testStandardSchemaConverter: StandardSchemaConverter = (
  schema,
  { schemaType }
) => {
  const vendor = (schema as { '~standard'?: { vendor?: string } })['~standard']
    ?.vendor;
  switch (vendor) {
    case 'zod': {
      const converted = createSchema(schema as never, {
        io: schemaType,
        openapiVersion: '3.0.0'
      });
      return {
        schema: converted.schema as SchemaObject | ReferenceObject,
        components:
          converted.components as unknown as Record<string, SchemaObject>
      };
    }
    case 'valibot':
      return {
        schema: toJsonSchema(schema as any, {
          target: 'openapi-3.0',
          typeMode: schemaType
        }) as unknown as SchemaObject | ReferenceObject
      };
    default:
      return undefined;
  }
};
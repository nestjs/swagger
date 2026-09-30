import { Body, Param, Query, Type } from '@nestjs/common';
import 'reflect-metadata';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';
import { ApiParam } from '../../lib/decorators/api-param.decorator';
import { ApiQuery } from '../../lib/decorators/api-query.decorator';
import { exploreApiParametersMetadata } from '../../lib/explorers/api-parameters.explorer';
import { StandardSchemaConverter } from '../../lib/interfaces';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

const testStandardSchemaConverter: StandardSchemaConverter = (
  schema,
  { schemaType }
) => {
  if (!(schema instanceof z.ZodType)) {
    return undefined;
  }
  const converted = createSchema(schema, {
    io: schemaType,
    openapiVersion: '3.0.0'
  });
  return {
    schema: converted.schema as any,
    components: converted.components as any
  };
};

describe('exploreApiParametersMetadata', () => {
  let schemaObjectFactory: SchemaObjectFactory;

  beforeEach(() => {
    schemaObjectFactory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper(),
      testStandardSchemaConverter
    );
  });

  const explore = (instance: object, method: Function) =>
    exploreApiParametersMetadata(
      {},
      schemaObjectFactory,
      instance,
      Object.getPrototypeOf(instance) as Type<unknown>,
      method
    );

  describe('standard schema query params combined with @ApiQuery', () => {
    it('should merge @ApiQuery metadata into the standard schema parameter instead of duplicating it', () => {
      class ItemsController {
        @ApiQuery({
          name: 'limit',
          required: false,
          type: Number,
          description: 'Max results'
        })
        list(
          @Query({
            schema: z.strictObject({
              limit: z.coerce.number().int().min(1).max(100).optional()
            })
          })
          query: unknown
        ) {
          return query;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.list);
      const limitParams = result!.parameters.filter(
        (param: any) => param.name === 'limit'
      );

      expect(limitParams).toHaveLength(1);
      expect(limitParams[0]).toEqual(
        expect.objectContaining({
          name: 'limit',
          in: 'query',
          required: false,
          description: 'Max results',
          schema: { type: 'integer', minimum: 1, maximum: 100 }
        })
      );
    });

    it('should keep standard schema query params that have no matching @ApiQuery', () => {
      class SearchController {
        @ApiQuery({
          name: 'term',
          required: true,
          type: String,
          description: 'Search term'
        })
        search(
          @Query({
            schema: z.strictObject({
              term: z.string(),
              page: z.coerce.number().int().optional()
            })
          })
          query: unknown
        ) {
          return query;
        }
      }

      const instance = new SearchController();
      const result = explore(instance, instance.search);
      const names = result!.parameters.map((param: any) => param.name).sort();

      expect(names).toEqual(['page', 'term']);
      expect(
        result!.parameters.find((param: any) => param.name === 'term')
      ).toEqual(
        expect.objectContaining({
          required: true,
          description: 'Search term',
          schema: { type: 'string' }
        })
      );
    });

    it("should let @ApiQuery's required default override the schema-derived required flag", () => {
      // `@ApiQuery` defaults `required` to true, and the explicit metadata wins
      // the merge, so an optional schema field decorated without an explicit
      // `required` comes out required. Class DTOs behave the same way.
      class RequiredController {
        @ApiQuery({ name: 'decorated', description: 'Decorated field' })
        list(
          @Query({
            schema: z.strictObject({
              decorated: z.string().optional(),
              untouched: z.string().optional()
            })
          })
          query: unknown
        ) {
          return query;
        }
      }

      const instance = new RequiredController();
      const result = explore(instance, instance.list);

      expect(
        result!.parameters.find((param: any) => param.name === 'decorated')
      ).toEqual(
        expect.objectContaining({
          required: true,
          description: 'Decorated field'
        })
      );
      // Untouched by @ApiQuery, so the schema still decides.
      expect(
        result!.parameters.find((param: any) => param.name === 'untouched')
      ).toEqual(expect.objectContaining({ required: false }));
    });

    it('should keep a schema-derived required flag when @ApiQuery sets it explicitly', () => {
      class ExplicitController {
        @ApiQuery({ name: 'optional', required: false })
        list(
          @Query({ schema: z.strictObject({ optional: z.string() }) })
          query: unknown
        ) {
          return query;
        }
      }

      const instance = new ExplicitController();
      const result = explore(instance, instance.list);

      expect(result!.parameters).toHaveLength(1);
      expect(result!.parameters[0]).toEqual(
        expect.objectContaining({ name: 'optional', required: false })
      );
    });
  });

  describe('multiple standard schema params on one handler', () => {
    it('should expand two @Query({ schema }) params instead of collapsing them', () => {
      // Before the params are expanded they are both unnamed, so
      // `hasSameParameterIdentity` matched them on `undefined === undefined`
      // and only one survived.
      class MultiQueryController {
        @ApiQuery({ name: 'page', required: false })
        list(
          @Query({ schema: z.strictObject({ page: z.coerce.number().int() }) })
          pagination: unknown,
          @Query({ schema: z.strictObject({ sort: z.string() }) })
          sorting: unknown
        ) {
          return [pagination, sorting];
        }
      }

      const instance = new MultiQueryController();
      const result = explore(instance, instance.list);
      const names = result!.parameters.map((param: any) => param.name).sort();

      expect(names).toEqual(['page', 'sort']);
      expect(
        result!.parameters.find((param: any) => param.name === 'sort')
      ).toEqual(
        expect.objectContaining({ in: 'query', schema: { type: 'string' } })
      );
    });

    it('should leave standard schema body params untouched', () => {
      class BodyController {
        create(
          @Body({
            schema: z.strictObject({ title: z.string(), count: z.number() })
          })
          body: unknown
        ) {
          return body;
        }
      }

      const instance = new BodyController();
      const result = explore(instance, instance.create);
      const bodyParams = (result?.parameters ?? []).filter(
        (param: any) => param.in === 'body'
      );

      expect(bodyParams).toHaveLength(1);
    });
  });
  describe('schema options set alongside a parameter schema', () => {
    it('should keep the @ApiParam example for a standard schema path param', () => {
      class ItemsController {
        @ApiParam({ name: 'id', example: 'abc-123', description: 'Item id' })
        findOne(@Param('id', { schema: z.string() }) id: string) {
          return id;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.findOne);

      expect(result!.parameters).toEqual([
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Item id',
          schema: { type: 'string', example: 'abc-123' }
        }
      ]);
    });

    it('should keep the @ApiQuery example for an expanded standard schema query param', () => {
      class ItemsController {
        @ApiQuery({ name: 'limit', example: 10 })
        list(
          @Query({ schema: z.strictObject({ limit: z.coerce.number() }) })
          query: unknown
        ) {
          return query;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.list);

      expect(result!.parameters).toEqual([
        expect.objectContaining({
          name: 'limit',
          in: 'query',
          schema: { type: 'number', example: 10 }
        })
      ]);
    });

    it('should keep the example when @ApiParam defines an explicit schema', () => {
      class ItemsController {
        @ApiParam({
          name: 'id',
          example: 'abc-123',
          default: 'abc',
          schema: { type: 'string' }
        })
        findOne(@Param('id') id: string) {
          return id;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.findOne);

      expect(result!.parameters[0].schema).toEqual({
        type: 'string',
        example: 'abc-123',
        default: 'abc'
      });
    });

    it('should let options already present in the schema take precedence', () => {
      class ItemsController {
        @ApiParam({ name: 'id', example: 'from-decorator' })
        findOne(
          @Param('id', { schema: z.string().meta({ example: 'from-schema' }) })
          id: string
        ) {
          return id;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.findOne);

      expect(result!.parameters[0].schema).toEqual({
        type: 'string',
        example: 'from-schema'
      });
    });

    it('should wrap a $ref schema in allOf when adding schema options', () => {
      class ItemsController {
        @ApiParam({
          name: 'id',
          example: 'abc-123',
          schema: { $ref: '#/components/schemas/ItemId' }
        })
        findOne(@Param('id') id: string) {
          return id;
        }
      }

      const instance = new ItemsController();
      const result = explore(instance, instance.findOne);

      expect(result!.parameters[0].schema).toEqual({
        example: 'abc-123',
        allOf: [{ $ref: '#/components/schemas/ItemId' }]
      });
    });
  });
});

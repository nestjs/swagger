import 'reflect-metadata';
import { Body, Query } from '@nestjs/common';
import { z } from 'zod';
import { createSchema } from 'zod-openapi';
import { ApiQuery } from '../../lib/decorators/api-query.decorator';
import { exploreApiParametersMetadata } from '../../lib/explorers/api-parameters.explorer';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

const standardSchemaConverter = (schema: any, { schemaType }: any) => {
  if (schema instanceof z.ZodType) {
    const converted = createSchema(schema, {
      io: schemaType,
      openapiVersion: '3.0.0'
    });
    return { schema: converted.schema, components: converted.components };
  }
  return undefined;
};

const createFactory = () =>
  new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper(),
    standardSchemaConverter
  );

const explore = (ctor: any, method: Function) =>
  exploreApiParametersMetadata(
    {},
    createFactory(),
    new ctor(),
    ctor.prototype,
    method
  );

describe('api-parameters.explorer', () => {
  describe('standard schema query params combined with @ApiQuery', () => {
    it('should merge @ApiQuery metadata into the standard schema parameter instead of duplicating it', () => {
      class ItemsController {
        list(query: unknown) {
          return query;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        ItemsController.prototype,
        'list'
      )!;

      Query({
        schema: z.strictObject({
          limit: z.coerce.number().int().min(1).max(100).optional()
        })
      } as any)(ItemsController.prototype, 'list', 0);
      Reflect.defineMetadata(
        'design:paramtypes',
        [Object],
        ItemsController.prototype,
        'list'
      );
      ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Max results'
      })(ItemsController.prototype, 'list', descriptor);

      const result = explore(ItemsController, descriptor.value);
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
        search(query: unknown) {
          return query;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        SearchController.prototype,
        'search'
      )!;

      Query({
        schema: z.strictObject({
          term: z.string(),
          page: z.coerce.number().int().optional()
        })
      } as any)(SearchController.prototype, 'search', 0);
      Reflect.defineMetadata(
        'design:paramtypes',
        [Object],
        SearchController.prototype,
        'search'
      );
      ApiQuery({
        name: 'term',
        required: true,
        type: String,
        description: 'Search term'
      })(SearchController.prototype, 'search', descriptor);

      const result = explore(SearchController, descriptor.value);
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

    it('should preserve schema-derived required flags when @ApiQuery omits them', () => {
      class RequiredController {
        list(query: unknown) {
          return query;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        RequiredController.prototype,
        'list'
      )!;

      Query({
        schema: z.strictObject({
          mandatory: z.string(),
          optional: z.string().optional()
        })
      } as any)(RequiredController.prototype, 'list', 0);
      Reflect.defineMetadata(
        'design:paramtypes',
        [Object],
        RequiredController.prototype,
        'list'
      );
      ApiQuery({ name: 'mandatory', description: 'Required field' })(
        RequiredController.prototype,
        'list',
        descriptor
      );

      const result = explore(RequiredController, descriptor.value);

      expect(
        result!.parameters.find((param: any) => param.name === 'mandatory')
      ).toEqual(
        expect.objectContaining({
          required: true,
          description: 'Required field'
        })
      );
      expect(
        result!.parameters.find((param: any) => param.name === 'optional')
      ).toEqual(expect.objectContaining({ required: false }));
    });

    it('should leave standard schema body params untouched', () => {
      class BodyController {
        create(body: unknown) {
          return body;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        BodyController.prototype,
        'create'
      )!;

      Body({
        schema: z.strictObject({ title: z.string(), count: z.number() })
      } as any)(BodyController.prototype, 'create', 0);
      Reflect.defineMetadata(
        'design:paramtypes',
        [Object],
        BodyController.prototype,
        'create'
      );

      const result = explore(BodyController, descriptor.value);
      const bodyParams = (result?.parameters ?? []).filter(
        (param: any) => param.in === 'body'
      );

      expect(bodyParams).toHaveLength(1);
      expect(createFactory().expandStandardSchemaParam(
        {
          in: 'body',
          type: Object,
          required: true,
          standardSchema: z.strictObject({ title: z.string() })
        } as any,
        {}
      )).toBeUndefined();
    });

    it('should leave a named standard schema query param as a single parameter', () => {
      expect(createFactory().expandStandardSchemaParam(
        {
          in: 'query',
          name: 'filter',
          type: Object,
          required: false,
          standardSchema: z.strictObject({ nested: z.string() })
        } as any,
        {}
      )).toBeUndefined();
    });

    it('should not expand a standard schema that does not convert to an object schema', () => {
      expect(createFactory().expandStandardSchemaParam(
        {
          in: 'query',
          type: Object,
          required: false,
          standardSchema: z.union([z.string(), z.number()])
        } as any,
        {}
      )).toBeUndefined();
    });
  });
});

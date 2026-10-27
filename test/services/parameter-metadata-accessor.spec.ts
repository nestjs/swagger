import { Body, Param, ParseUUIDPipe, Query, Type } from '@nestjs/common';
import 'reflect-metadata';
import * as v from 'valibot';
import { z } from 'zod';
import { ParameterMetadataAccessor } from '../../lib/services/parameter-metadata-accessor';

describe('ParameterMetadataAccessor', () => {
  const accessor = new ParameterMetadataAccessor();

  it('should preserve standard schema metadata from Nest route decorators', () => {
    const bodySchema = z.object({ name: z.string() });
    const querySchema = v.object({ page: v.number() });
    const paramSchema = z.string().min(3);

    class TestController {
      method(
        @Body({ schema: bodySchema }) body: unknown,
        @Query({ schema: querySchema }) query: unknown,
        @Param('id', { schema: paramSchema }) id: string
      ) {
        return { body, query, id };
      }
    }

    const instance = new TestController();
    const metadata = accessor.explore(
      instance,
      TestController.prototype as any as Type<unknown>,
      instance.method
    );

    expect(metadata).toBeDefined();
    expect(Object.values(metadata!)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'body', standardSchema: bodySchema }),
        expect.objectContaining({ in: 'query', standardSchema: querySchema }),
        expect.objectContaining({
          in: 'path',
          name: 'id',
          standardSchema: paramSchema
        })
      ])
    );
  });

  it('should infer format "uuid" when ParseUUIDPipe is passed as class, instance, or option', () => {
    class TestController {
      method(
        @Param('tenantId', ParseUUIDPipe) tenantId: string,
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
        @Query('filterId', { pipes: [ParseUUIDPipe] }) filterId: unknown
      ) {
        return { tenantId, id, filterId };
      }
    }

    const instance = new TestController();
    const metadata = accessor.explore(
      instance,
      TestController.prototype as any as Type<unknown>,
      instance.method
    );

    expect(metadata).toBeDefined();
    expect(Object.values(metadata!)).toEqual([
      {
        in: 'path',
        name: 'tenantId',
        type: String,
        required: true,
        format: 'uuid',
        standardSchema: undefined
      },
      {
        in: 'path',
        name: 'id',
        type: String,
        required: true,
        format: 'uuid',
        standardSchema: undefined
      },
      {
        in: 'query',
        name: 'filterId',
        type: String,
        required: true,
        format: 'uuid',
        standardSchema: undefined
      }
    ]);
  });
});

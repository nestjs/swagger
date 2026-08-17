import { Body, Param, Query, Type } from '@nestjs/common';
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
});

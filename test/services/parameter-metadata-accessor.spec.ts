import {
  Body,
  createParamDecorator,
  Headers,
  Param,
  Query,
  Type
} from '@nestjs/common';
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
  it('should not document the parameters of an overridden parent handler', () => {
    class ParentController {
      findOne(
        @Query('impersonateAccountId') impersonateAccountId: string,
        @Headers('x-staff-token') staffToken: string
      ) {}
    }
    class ChildController extends ParentController {
      override findOne(@Param('id') id: string) {
        return id;
      }
    }
    class InheritingController extends ParentController {}

    const childMetadata = accessor.explore(
      new ChildController(),
      ChildController.prototype as unknown as Type<unknown>,
      ChildController.prototype.findOne
    );
    const inheritedMetadata = accessor.explore(
      new InheritingController(),
      InheritingController.prototype as unknown as Type<unknown>,
      InheritingController.prototype.findOne
    );

    expect(
      Object.values(childMetadata).map(({ in: location, name }) => [
        location,
        name
      ])
    ).toEqual([['path', 'id']]);
    expect(
      Object.values(inheritedMetadata).map(({ in: location, name }) => [
        location,
        name
      ])
    ).toEqual([
      ['query', 'impersonateAccountId'],
      ['header', 'x-staff-token']
    ]);
  });

  it('should keep every parameter decorator declared on the same handler', () => {
    const Custom = createParamDecorator(() => 'custom');
    class BodyDto {}
    class TestController {
      create(@Custom() @Body() dto: BodyDto) {}
    }

    const metadata = accessor.explore(
      new TestController(),
      TestController.prototype as unknown as Type<unknown>,
      TestController.prototype.create
    );

    expect(
      Object.values(metadata).map(({ in: location }) => location)
    ).toContain('body');
  });
});

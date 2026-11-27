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

  it('should not document the parameters of an overridden parent handler when the override is inherited', () => {
    class ParentController {
      findOne(
        @Param('id') id: string,
        @Query('impersonateAccountId') impersonateAccountId: string,
        @Headers('x-staff-token') staffToken: string
      ) {}
    }
    class ChildController extends ParentController {
      override findOne(@Param('id') id: string) {
        return id;
      }
    }
    class GrandchildController extends ChildController {}
    class OverridingGrandchildController extends GrandchildController {
      override findOne(
        @Param('id') id: string,
        @Query('expand') expand?: string
      ) {
        return id;
      }
    }
    class GreatGrandchildController extends OverridingGrandchildController {}

    const explore = (controller: Type<ParentController>) =>
      Object.values(
        accessor.explore(
          new controller(),
          controller.prototype as unknown as Type<unknown>,
          controller.prototype.findOne
        )
      ).map(({ in: location, name }) => [location, name]);

    expect(explore(ChildController)).toEqual([['path', 'id']]);
    expect(explore(GrandchildController)).toEqual([['path', 'id']]);
    expect(explore(OverridingGrandchildController)).toEqual([
      ['path', 'id'],
      ['query', 'expand']
    ]);
    expect(explore(GreatGrandchildController)).toEqual([
      ['path', 'id'],
      ['query', 'expand']
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

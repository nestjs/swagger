import { Controller, Get, Param } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiParam } from '../../lib/decorators';
import { exploreApiParametersMetadata } from '../../lib/explorers/api-parameters.explorer';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

describe('ApiParam', () => {
  describe('when applied on the class level', () => {
    @ApiParam({ name: 'testId' })
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      public get(@Param('testId') testId: string): string {
        return testId;
      }

      public noAPiMethod(): void {}
    }

    it('should attach metadata to all API methods', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'path', name: 'testId', required: true }]);
    });

    it('should not attach metadata to non-API method (not a route)', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.noAPiMethod)
      ).toBeFalsy();
    });
  });

  describe('when applied on the method level', () => {
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      @ApiParam({ name: 'testId' })
      public get(@Param('testId') testId: string): string {
        return testId;
      }
    }

    it('should attach metadata to a given method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'path', name: 'testId', required: true }]);
    });
  });

  describe('extensions support', () => {
    it('should merge extensions into parameter metadata when provided (method level)', () => {
      @Controller('tests/:testId')
      class TestAppController {
        @Get()
        @ApiParam({ name: 'testId', extensions: { 'x-permissions': ['test.customer.add'] } })
        public get(@Param('testId') testId: string): string {
          return testId;
        }
      }

      const controller = new TestAppController();
      expect(Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)).toBeTruthy();
      expect(Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)).toEqual([
        { in: 'path', name: 'testId', required: true, 'x-permissions': ['test.customer.add'] }
      ]);
    });

    it('should auto-prefix extension keys without x- (class level)', () => {
      @ApiParam({ name: 'testId', extensions: { permissions: ['test.customer.add'] } })
      @Controller('tests/:testId')
      class TestAppController2 {
        @Get()
        public get(@Param('testId') testId: string): string {
          return testId;
        }
      }

      const controller = new TestAppController2();
      expect(Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)).toBeTruthy();
      expect(Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)).toEqual([
        { in: 'path', name: 'testId', required: true, 'x-permissions': ['test.customer.add'] }
      ]);
    });
  });

  describe('when the type is written as an array', () => {
    it('should document an array of that type', () => {
      class TestAppController {
        @ApiParam({ name: 'ids', type: [String] })
        @Get(':ids')
        public get(): void {}
      }

      const accessor = new ModelPropertiesAccessor();
      const mapper = new SwaggerTypesMapper();
      const result = exploreApiParametersMetadata(
        {},
        new SchemaObjectFactory(accessor, mapper),
        undefined,
        new TestAppController(),
        TestAppController as any,
        TestAppController.prototype.get
      );

      expect(result.parameters).toEqual([
        {
          name: 'ids',
          in: 'path',
          required: true,
          schema: { type: 'array', items: { type: 'string' } }
        }
      ]);
    });
  });
});

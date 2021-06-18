import { Controller, Get, Param } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { DECORATORS } from '../../lib/constants';
import { ApiParam } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { SwaggerExplorer } from '../../lib/swagger-explorer';

describe('ApiParam', () => {
  const schemaObjectFactory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  
  describe('class decorator', () => {
    @ApiParam({ name: 'testId' })
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      public get(@Param('testId') testId: string): string {
        return testId;
      }

      public noAPiMethod(): void {}
    }

    it('should get ApiParam options from api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'path', name: 'testId', required: true }]);
    });

    it('should not get ApiParam options from non api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.noAPiMethod)
      ).toBeFalsy();
    });

    it('should properly define path', ()=>{
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new TestAppController(),
          metatype: TestAppController
        } as InstanceWrapper<TestAppController>,
        'path'
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: "path",
          name: "testId",
          required: true,
          schema: { type: "string" }
        }
      ]);
    });
  });

  describe('method decorator', () => {
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      @ApiParam({ name: 'testId' })
      public get(@Param('testId') testId: string): string {
        return testId;
      }
    }

    it('should get ApiParam options from api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'path', name: 'testId', required: true }]);
    });

    it('should properly define path', ()=>{
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new TestAppController(),
          metatype: TestAppController
        } as InstanceWrapper<TestAppController>,
        'path'
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: "path",
          name: "testId",
          required: true,
          schema: { type: "string" }
        }
      ]);
    });
  });
});

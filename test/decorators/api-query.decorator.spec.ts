import { Controller, Get, Query } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiQuery } from '../../lib/decorators';

describe('ApiQuery', () => {
  describe('class decorator', () => {
    @ApiQuery({ name: 'testId' })
    @Controller('test')
    class TestAppController {
      @Get()
      public get(@Query('testId') testId: string): string {
        return testId;
      }

      public noAPiMethod(): void {
      }
    }

    it('should get ApiQuery options from api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'query', name: 'testId', required: true }]);
    });

    it('should not get ApiQuery options from non api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.noAPiMethod)
      ).toBeFalsy();
    });
  });

  describe('method decorator', () => {
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      @ApiQuery({ name: 'testId' })
      public get(@Query('testId') testId: string): string {
        return testId;
      }
    }

    it('should get ApiQuery options from api method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'query', name: 'testId', required: true }]);
    });
  });
});

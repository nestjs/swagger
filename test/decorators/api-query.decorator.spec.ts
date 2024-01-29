import { Controller, Get, Query } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiQuery } from '../../lib/decorators';

describe('ApiQuery', () => {
  describe('when applied on the class level', () => {
    @ApiQuery({ name: 'testId' })
    @Controller('test')
    class TestAppController {
      @Get()
      public get(@Query('testId') testId: string): string {
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
      ).toEqual([{ in: 'query', name: 'testId', required: true }]);
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
      @ApiQuery({ name: 'testId' })
      public get(@Query('testId') testId: string): string {
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
      ).toEqual([{ in: 'query', name: 'testId', required: true }]);
    });
  });
});

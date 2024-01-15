import { Controller, Get, Param } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiParam } from '../../lib/decorators';

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
});

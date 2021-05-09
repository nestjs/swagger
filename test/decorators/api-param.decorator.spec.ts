import { Controller, Get, Param } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiParam } from '../../lib/decorators';

describe('ApiParam', () => {
  describe('class decorator', () => {
    @ApiParam({ name: 'testId' })
    @Controller('tests/:testId')
    class TestAppController {
      @Get()
      public get(@Param('testId') testId: string): string {
        return testId;
      }
    }

    it('should get ApiParam options from get method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.get)
      ).toEqual([{ in: 'path', name: 'testId', required: true }]);
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

    it('should get ApiParam options from get method', () => {
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

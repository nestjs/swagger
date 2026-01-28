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

  describe('when type is specified', () => {
    class TestAppController {
      @Get('string')
      @ApiQuery({ name: 'search', type: 'string' })
      public getString(@Query('search') s: string) {}

      @Get('number')
      @ApiQuery({ name: 'page', type: 'number' })
      public getNumber(@Query('page') p: number) {}

      @Get('boolean')
      @ApiQuery({ name: 'sort', type: 'boolean' })
      public getBoolean(@Query('sort') b: boolean) {}

      @Get('custom')
      @ApiQuery({ name: 'custom', type: 'uuid' as any }) // (string & {}) test to any string (like uuid) via type widening
      public getCustom(@Query('custom') c: string) {}
    }

    const controller = new TestAppController();

    it('should store "string" type in metadata', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.getString
      );
      expect(metadata[0].type).toEqual('string');
    });

    it('should store "number" type in metadata', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.getNumber
      );
      expect(metadata[0].type).toEqual('number');
    });

    it('should store "boolean" literal type in metadata', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.getBoolean
      );
      expect(metadata[0].type).toEqual('boolean');
    });

    it('should store any string (like uuid) via type widening', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.getCustom
      );
      expect(metadata[0].type).toEqual('uuid');
    });
  });
});

import 'reflect-metadata';
import { DECORATORS } from '../../lib/constants';
import { ApiIncludeEndpoint } from '../../lib/decorators/api-include-endpoint.decorator';

describe('ApiIncludeEndpoint', () => {
  describe('with default arguments', () => {
    class TestController {
      @ApiIncludeEndpoint()
      decorated() {}
    }

    it('should store metadata with disable=true by default', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_INCLUDE_ENDPOINT,
        TestController.prototype.decorated
      );
      expect(metadata).toEqual({ disable: true });
    });
  });

  describe('with explicit true argument', () => {
    class TestController {
      @ApiIncludeEndpoint(true)
      decorated() {}
    }

    it('should store metadata with disable=true', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_INCLUDE_ENDPOINT,
        TestController.prototype.decorated
      );
      expect(metadata).toEqual({ disable: true });
    });
  });

  describe('with explicit false argument', () => {
    class TestController {
      @ApiIncludeEndpoint(false)
      decorated() {}
    }

    it('should store metadata with disable=false', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_INCLUDE_ENDPOINT,
        TestController.prototype.decorated
      );
      expect(metadata).toEqual({ disable: false });
    });
  });

  describe('without the decorator', () => {
    class TestController {
      undecorated() {}
    }

    it('should not attach any metadata to the method', () => {
      expect(
        Reflect.hasMetadata(
          DECORATORS.API_INCLUDE_ENDPOINT,
          TestController.prototype.undecorated
        )
      ).toBe(false);
      expect(
        Reflect.getMetadata(
          DECORATORS.API_INCLUDE_ENDPOINT,
          TestController.prototype.undecorated
        )
      ).toBeUndefined();
    });
  });

  describe('with multiple methods on the same class', () => {
    class TestController {
      @ApiIncludeEndpoint()
      first() {}

      @ApiIncludeEndpoint(false)
      second() {}

      third() {}
    }

    it('should track metadata independently per method', () => {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_INCLUDE_ENDPOINT,
          TestController.prototype.first
        )
      ).toEqual({ disable: true });
      expect(
        Reflect.getMetadata(
          DECORATORS.API_INCLUDE_ENDPOINT,
          TestController.prototype.second
        )
      ).toEqual({ disable: false });
      expect(
        Reflect.hasMetadata(
          DECORATORS.API_INCLUDE_ENDPOINT,
          TestController.prototype.third
        )
      ).toBe(false);
    });
  });
});

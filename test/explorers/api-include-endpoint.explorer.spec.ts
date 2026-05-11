import 'reflect-metadata';
import { ApiIncludeEndpoint } from '../../lib/decorators/api-include-endpoint.decorator';
import { exploreApiIncludeEndpointMetadata } from '../../lib/explorers/api-include-endpoint.explorer';

describe('api-include-endpoint.explorer', () => {
  describe('exploreApiIncludeEndpointMetadata', () => {
    describe('with @ApiIncludeEndpoint() (default)', () => {
      class TestController {
        @ApiIncludeEndpoint()
        decorated() {}
      }

      it('should return { disable: true }', () => {
        const instance = new TestController();
        const result = exploreApiIncludeEndpointMetadata(
          instance,
          TestController,
          instance.decorated
        );
        expect(result).toEqual({ disable: true });
      });
    });

    describe('with @ApiIncludeEndpoint(false)', () => {
      class TestController {
        @ApiIncludeEndpoint(false)
        decorated() {}
      }

      it('should return { disable: false }', () => {
        const instance = new TestController();
        const result = exploreApiIncludeEndpointMetadata(
          instance,
          TestController,
          instance.decorated
        );
        expect(result).toEqual({ disable: false });
      });
    });

    describe('without the decorator', () => {
      class TestController {
        undecorated() {}
      }

      it('should return undefined', () => {
        const instance = new TestController();
        const result = exploreApiIncludeEndpointMetadata(
          instance,
          TestController,
          instance.undecorated
        );
        expect(result).toBeUndefined();
      });
    });
  });
});

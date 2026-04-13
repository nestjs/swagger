import { Controller, Get } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiHeader, ApiOptionalHeader } from '../../lib/decorators';

describe('ApiHeader', () => {
  describe('when applied on the method level', () => {
    @Controller('test')
    class TestController {
      @Get()
      @ApiHeader({ name: 'x-required-header' })
      requiredRoute() {}

      @Get('optional')
      @ApiHeader({ name: 'x-explicit-optional', required: false })
      explicitOptionalRoute() {}

      @Get('optional-shorthand')
      @ApiOptionalHeader({ name: 'x-optional-shorthand' })
      optionalShorthandRoute() {}
    }

    it('should mark header as required by default', () => {
      const ctrl = new TestController();
      const [param] = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        ctrl.requiredRoute
      );
      expect(param.required).toBeUndefined();
    });

    it('should mark header as not required when required: false is set', () => {
      const ctrl = new TestController();
      const [param] = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        ctrl.explicitOptionalRoute
      );
      expect(param.required).toBe(false);
    });

    it('@ApiOptionalHeader should produce required: false', () => {
      const ctrl = new TestController();
      const [param] = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        ctrl.optionalShorthandRoute
      );
      expect(param.required).toBe(false);
    });

    it('@ApiOptionalHeader and explicit required: false should produce identical metadata', () => {
      const ctrl = new TestController();
      const [explicit] = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        ctrl.explicitOptionalRoute
      );
      const [shorthand] = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        ctrl.optionalShorthandRoute
      );
      expect(explicit.required).toEqual(shorthand.required);
    });
  });
});

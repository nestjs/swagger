import { DECORATORS } from '../../lib/constants';
import { ApiBearerAuth, ApiSecurity } from '../../lib/decorators';

describe('ApiSecurity', () => {
  describe('when several decorators are applied to the same target', () => {
    @ApiSecurity('first')
    @ApiSecurity({ second: ['read'] })
    class TestController {
      @ApiSecurity('first')
      @ApiSecurity('second', ['read'])
      public method(): void {}
    }

    it('should merge the requirements on a method', () => {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_SECURITY,
          TestController.prototype.method
        )
      ).toEqual([{ second: ['read'] }, { first: [] }]);
    });

    it('should merge the requirements on a class', () => {
      expect(
        Reflect.getMetadata(DECORATORS.API_SECURITY, TestController)
      ).toEqual([{ second: ['read'] }, { first: [] }]);
    });
  });

  describe('when the same decorator instance is applied to several targets', () => {
    const JwtAuth = ApiBearerAuth();

    class TestController {
      @JwtAuth
      @ApiSecurity('partner-key')
      public withOtherRequirement(): void {}

      @JwtAuth
      public withoutOtherRequirement(): void {}
    }

    @JwtAuth
    class OtherController {}

    it('should merge with the requirements of the decorated target', () => {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_SECURITY,
          TestController.prototype.withOtherRequirement
        )
      ).toEqual([{ 'partner-key': [] }, { bearer: [] }]);
    });

    it('should not carry the requirements of one method over to another', () => {
      expect(
        Reflect.getMetadata(
          DECORATORS.API_SECURITY,
          TestController.prototype.withoutOtherRequirement
        )
      ).toEqual([{ bearer: [] }]);
    });

    it('should not carry the requirements of a method over to a class', () => {
      expect(
        Reflect.getMetadata(DECORATORS.API_SECURITY, OtherController)
      ).toEqual([{ bearer: [] }]);
    });
  });
});

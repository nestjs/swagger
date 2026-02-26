import { Controller, Post } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiWebhook } from '../../lib/decorators';

describe('ApiWebhook', () => {
  describe('when applied on the method level', () => {
    @Controller()
    class TestController {
      @Post()
      @ApiWebhook('stripeEvent')
      public stripe() {
        return true;
      }

      @Post('default')
      @ApiWebhook()
      public defaultWebhook() {
        return true;
      }
    }

    it('should attach metadata with a webhook name', () => {
      const controller = new TestController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_WEBHOOK, controller.stripe)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_WEBHOOK, controller.stripe)
      ).toBe('stripeEvent');
    });

    it('should attach metadata with a default marker', () => {
      const controller = new TestController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_WEBHOOK, controller.defaultWebhook)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_WEBHOOK, controller.defaultWebhook)
      ).toBe(true);
    });
  });
});

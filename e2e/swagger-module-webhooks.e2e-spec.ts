import { Controller, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiOkResponse,
  ApiWebhook,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule webhooks handling', () => {
  @Controller()
  class StripeWebhooksController {
    @Post('stripe')
    @ApiWebhook('stripeEvent')
    stripe() {
      return { ok: true };
    }
  }

  @Module({ controllers: [StripeWebhooksController] })
  class AppModule {}

  it('adds webhook routes to paths for OAS < 3.1', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion('3.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);

    expect(document.webhooks).toBeUndefined();
    expect(document.paths['/stripe']).toBeDefined();

    await app.close();
  });

  it('emits webhooks separately for OAS >= 3.1', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion('3.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);

    expect(document.webhooks?.stripeEvent).toBeDefined();
    expect(document.paths['/stripe']).toBeUndefined();

    await app.close();
  });

  it('converts nullable schemas of a webhook named "default" for OAS >= 3.1', async () => {
    @Controller()
    class DefaultWebhookController {
      @Post('events')
      @ApiWebhook('default')
      @ApiOkResponse({ type: String, nullable: true })
      events() {}
    }

    @Module({ controllers: [DefaultWebhookController] })
    class DefaultWebhookModule {}

    const app = await NestFactory.create(DefaultWebhookModule, {
      logger: false
    });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion('3.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);

    expect(
      (document.webhooks!.default.post!.responses['200'] as any).content[
        'application/json'
      ].schema
    ).toEqual({ type: ['string', 'null'] });

    await app.close();
  });
});

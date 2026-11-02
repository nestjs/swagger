import { Controller, Logger, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiBearerAuth,
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

  it('keeps the regular operation when a webhook shares its path and method for OAS < 3.1', async () => {
    @Controller({ path: 'orders', host: 'api.example.com' })
    class OrdersController {
      @Post()
      @ApiBearerAuth()
      create() {}
    }

    @Controller({ path: 'orders', host: 'hooks.example.com' })
    class OrderEventsController {
      @Post()
      @ApiWebhook('orderEvent')
      receive() {}
    }

    @Controller('invoices')
    class InvoicesController {
      @Post()
      @ApiWebhook('invoiceCreated')
      invoiceCreated() {}

      @Post()
      @ApiBearerAuth()
      create() {}
    }

    @Module({
      controllers: [OrderEventsController, OrdersController, InvoicesController]
    })
    class DuplicatesModule {}

    const app = await NestFactory.create(DuplicatesModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion('3.0.0')
      .addBearerAuth()
      .build();
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const document = SwaggerModule.createDocument(app, config);
    const bearer = [{ bearer: [] }];

    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      'Webhook "POST /orders" shares its path and method with a route, so it is left out of the OpenAPI 3.0.0 document. Use OpenAPI 3.1 or later to document both.',
      'Webhook "POST /invoices" shares its path and method with a route, so it is left out of the OpenAPI 3.0.0 document. Use OpenAPI 3.1 or later to document both.'
    ]);
    warn.mockRestore();

    expect(document.webhooks).toBeUndefined();
    expect(document.paths['/orders'].post).toMatchObject({
      operationId: 'OrdersController_create',
      security: bearer
    });
    expect(document.paths['/invoices'].post).toMatchObject({
      operationId: 'InvoicesController_create',
      security: bearer
    });

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

import { All, Controller, Logger, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
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

  describe('unnamed webhooks of different controllers with the same method name', () => {
    abstract class EventsController {
      @Post('inherited')
      @ApiWebhook()
      receive() {}
    }

    @Controller('payments')
    @ApiSecurity({ bearer: [], signature: [] })
    class PaymentsController extends EventsController {
      @Post()
      @ApiWebhook()
      handle() {}

      @Post(['refunds', 'chargebacks'])
      @ApiWebhook()
      refund() {}
    }

    @Controller('shipments')
    @ApiBearerAuth()
    class ShipmentsController extends EventsController {
      @Post()
      @ApiWebhook()
      handle() {}

      @Post('refunds')
      @ApiWebhook('refund')
      shipmentRefund() {}
    }

    @Controller('returns')
    class ReturnsController {
      @Post()
      @ApiWebhook()
      returned() {}

      @All('any')
      @ApiWebhook()
      anyEvent() {}
    }

    const createDocument = async (
      controllers: Function[],
      openApiVersion: string
    ) => {
      @Module({ controllers })
      class EventsModule {}

      const app = await NestFactory.create(EventsModule, { logger: false });
      await app.init();
      const config = new DocumentBuilder()
        .setTitle('t')
        .setVersion('1')
        .setOpenAPIVersion(openApiVersion)
        .build();
      const document = SwaggerModule.createDocument(app, config);
      await app.close();
      return document;
    };

    it.each([
      [[PaymentsController, ShipmentsController, ReturnsController]],
      [[ReturnsController, ShipmentsController, PaymentsController]]
    ])(
      'keeps each of them, keyed by class and method name, for OAS >= 3.1',
      async (controllers) => {
        const document = await createDocument(controllers, '3.1.0');

        expect(Object.keys(document.webhooks!).sort()).toEqual([
          'PaymentsController_handle',
          'PaymentsController_receive',
          'PaymentsController_refund',
          'ShipmentsController_handle',
          'ShipmentsController_receive',
          'anyEvent',
          'refund',
          'returned'
        ]);
        ['handle', 'receive'].forEach((method) => {
          expect(
            document.webhooks![`PaymentsController_${method}`].post
          ).toMatchObject({
            operationId: `PaymentsController_${method}`,
            security: [{ bearer: [], signature: [] }]
          });
          expect(
            document.webhooks![`ShipmentsController_${method}`].post
          ).toMatchObject({
            operationId: `ShipmentsController_${method}`,
            security: [{ bearer: [] }]
          });
        });
        expect(document.webhooks!.PaymentsController_refund.post).toMatchObject(
          { security: [{ bearer: [], signature: [] }] }
        );
        expect(document.webhooks!.refund.post).toMatchObject({
          operationId: 'ShipmentsController_shipmentRefund',
          security: [{ bearer: [] }]
        });
        expect(document.webhooks!.returned.post).toMatchObject({
          operationId: 'ReturnsController_returned'
        });
        expect(document.webhooks!.anyEvent.get).toMatchObject({
          operationId: 'ReturnsController_anyEvent_get'
        });
        expect(JSON.stringify(document)).not.toContain('qualifiedWebhookName');
      }
    );

    it('keeps the method name as the key of a webhook that shares it with no other for OAS >= 3.1', async () => {
      const document = await createDocument([PaymentsController], '3.1.0');

      expect(Object.keys(document.webhooks!).sort()).toEqual([
        'handle',
        'receive',
        'refund'
      ]);
    });

    it('adds them to paths for OAS < 3.1', async () => {
      const document = await createDocument(
        [PaymentsController, ShipmentsController, ReturnsController],
        '3.0.0'
      );

      expect(document.webhooks).toBeUndefined();
      expect(document.paths['/payments'].post).toMatchObject({
        operationId: 'PaymentsController_handle'
      });
      expect(document.paths['/shipments'].post).toMatchObject({
        operationId: 'ShipmentsController_handle'
      });
      expect(JSON.stringify(document)).not.toContain('qualifiedWebhookName');
    });
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

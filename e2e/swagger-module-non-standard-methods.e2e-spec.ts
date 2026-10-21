import {
  All,
  Controller,
  Get,
  Module,
  RequestMapping,
  RequestMethod,
  Search
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiWebhook, DocumentBuilder, SwaggerModule } from '../lib';
import SwaggerParser = require('@apidevtools/swagger-parser');

describe('SwaggerModule non-standard HTTP method handling', () => {
  @Controller('items')
  class ItemsController {
    @Get()
    findAll() {
      return [];
    }

    @Search()
    search() {
      return [];
    }

    @RequestMapping({ path: 'props', method: RequestMethod.PROPFIND })
    props() {
      return {};
    }
  }

  @Controller('proxy')
  class ProxyController {
    @All()
    proxy() {
      return {};
    }
  }

  @Controller()
  class SearchWebhooksController {
    @Search('search-hook')
    @ApiWebhook('searchEvent')
    searchHook() {
      return { ok: true };
    }
  }

  @Module({
    controllers: [ItemsController, ProxyController, SearchWebhooksController]
  })
  class AppModule {}

  const createDocument = async (openApiVersion: string) => {
    const app = await NestFactory.create(AppModule, { logger: false });
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

  it.each(['3.0.0', '3.1.0'])(
    'omits non-standard operations for OAS %s',
    async (openApiVersion) => {
      const document = await createDocument(openApiVersion);

      expect(document.paths['/items'].get).toBeDefined();
      expect(document.paths['/items']).not.toHaveProperty('search');
      expect(document.paths['/items/props']).toBeUndefined();
      expect(document.paths['/proxy']).not.toHaveProperty('search');
      expect(document.paths['/proxy']).not.toHaveProperty('query');
      expect(document.paths['/proxy'].get).toBeDefined();
    }
  );

  it('omits non-standard webhooks for OAS 3.1', async () => {
    const document = await createDocument('3.1.0');

    expect(document.webhooks?.searchEvent).toBeUndefined();
  });

  it.each(['3.0.0', '3.1.0'])(
    'produces a valid document for OAS %s',
    async (openApiVersion) => {
      const document = await createDocument(openApiVersion);

      await expect(
        SwaggerParser.validate(JSON.parse(JSON.stringify(document)) as any)
      ).resolves.toBeDefined();
    }
  );

  it('moves non-standard operations to additionalOperations for OAS >= 3.2', async () => {
    const document = await createDocument('3.2.0');

    expect(document.paths['/items']).not.toHaveProperty('search');
    expect(document.paths['/items'].get).toBeDefined();
    expect(
      document.paths['/items'].additionalOperations?.SEARCH?.operationId
    ).toBe('ItemsController_search');
    expect(
      document.paths['/items/props'].additionalOperations?.PROPFIND
    ).toBeDefined();

    expect(document.paths['/proxy']).not.toHaveProperty('search');
    expect(document.paths['/proxy'].query).toBeDefined();
    expect(
      document.paths['/proxy'].additionalOperations?.SEARCH?.operationId
    ).toBe('ProxyController_proxy_search');

    expect(document.webhooks?.searchEvent).not.toHaveProperty('search');
    expect(
      document.webhooks?.searchEvent.additionalOperations?.SEARCH
    ).toBeDefined();
  });
});

import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '../lib/index.js';

describe('SwaggerModule files of swagger-ui-dist outside the UI', () => {
  // The demo page of swagger-ui-dist loads "swagger-initializer.js".
  const stockFile = /swagger-initializer\.js|Apache License/;

  @Module({})
  class EmptyModule {}

  @Controller()
  class PagesController {
    @Get('index.html')
    index() {
      return 'application page';
    }
  }

  @Module({ controllers: [PagesController] })
  class PagesModule {}

  const createApp = async (
    adapter: 'express' | 'fastify',
    module: Function,
    path: string
  ) => {
    const app: INestApplication = await NestFactory.create(
      module,
      adapter === 'fastify' ? new FastifyAdapter() : new ExpressAdapter(),
      { logger: false }
    );
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build()
    );
    SwaggerModule.setup(path, app, document);
    await app.init();
    if (adapter === 'fastify') {
      await app.getHttpAdapter().getInstance().ready();
    }
    return app;
  };

  describe.each(['express', 'fastify'] as const)('%s', (adapter) => {
    it('does not serve them below any static assets prefix', async () => {
      const app = await createApp(adapter, EmptyModule, 'api/docs');
      const server = app.getHttpServer();

      for (const path of [
        '/api/docs/docs/',
        '/api/docs/docs/index.html',
        '/api/docs/docs/LICENSE',
        '/api/docs/license',
        '/api/docs//index.html',
        '/api/docs/index%2Ehtml',
        '/api/docs/./LICENSE',
        '/api/docs/LICENS%45'
      ]) {
        const response = await request(server).get(path);
        expect(response.text, path).not.toMatch(stockFile);
      }
      expect((await request(server).get('/api/docs/index.html')).text).toMatch(
        /swagger-ui-init\.js/
      );
      for (const path of [
        '/api/docs/swagger-ui.css',
        '/api/docs/docs/swagger-ui.css'
      ]) {
        expect((await request(server).get(path)).status, path).toEqual(200);
      }

      await app.close();
    });

    it('does not serve them for a root path', async () => {
      const app = await createApp(adapter, EmptyModule, '/');
      const server = app.getHttpServer();

      for (const path of ['/index.html', '/LICENSE']) {
        const response = await request(server).get(path);
        expect(response.text, path).not.toMatch(stockFile);
      }
      expect((await request(server).get('/swagger-ui.css')).status).toEqual(
        200
      );

      await app.close();
    });
  });

  it('keeps an application route with the same path for a root path (fastify)', async () => {
    const app = await createApp('fastify', PagesModule, '/');

    const response = await request(app.getHttpServer()).get('/index.html');
    expect(response.text).toEqual('application page');

    await app.close();
  });
});

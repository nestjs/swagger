import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication
} from '@nestjs/platform-express';
import * as request from 'supertest';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';

describe('Express Swagger', () => {
  let app: NestExpressApplication;
  let builder: DocumentBuilder;

  beforeEach(async () => {
    app = await NestFactory.create<NestExpressApplication>(
      ApplicationModule,
      new ExpressAdapter(),
      { logger: false }
    );

    builder = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .addTag('cats')
      .addBasicAuth()
      .addBearerAuth()
      .addOAuth2()
      .addApiKey()
      .addApiKey({ type: 'apiKey' }, 'key1')
      .addApiKey({ type: 'apiKey' }, 'key2')
      .addCookieAuth()
      .addSecurityRequirements('bearer')
      .addSecurityRequirements({ basic: [], cookie: [] });
  });

  it('should produce a valid OpenAPI 3.0 schema', async () => {
    const document = SwaggerModule.createDocument(app, builder.build());
    const doc = JSON.stringify(document, null, 2);

    try {
      let api = await SwaggerParser.validate(document as any);
      console.log(
        'API name: %s, Version: %s',
        api.info.title,
        api.info.version
      );
      expect(api.info.title).toEqual('Cats example');
    } catch (err) {
      console.log(doc);
      expect(err).toBeUndefined();
    }
  });

  it('should fix colons in url', async () => {
    const document = SwaggerModule.createDocument(app, builder.build());
    expect(document.paths['/express:colon:another/{prop}']).toBeDefined();
  });

  it('should setup multiple routes', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger1', app, document1);

    const document2 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger2', app, document2);

    await app.init();
    expect(app.getHttpAdapter().getInstance()).toBeDefined();
    await app.close();
  });

  describe('served swagger ui', () => {
    const SWAGGER_RELATIVE_URL = '/apidoc';

    beforeEach(async () => {
      const swaggerDocument = SwaggerModule.createDocument(
        app,
        builder.build()
      );
      SwaggerModule.setup(SWAGGER_RELATIVE_URL, app, swaggerDocument);

      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('content type of served json document should be valid', async () => {
      const response = await request(app.getHttpServer()).get(
        `${SWAGGER_RELATIVE_URL}-json`
      );

      expect(response.status).toEqual(200);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });
  });
});

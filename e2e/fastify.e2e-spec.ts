import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';

describe('Fastify Swagger', () => {
  let app: NestFastifyApplication;
  let builder: DocumentBuilder;

  beforeEach(async () => {
    app = await NestFactory.create<NestFastifyApplication>(
      ApplicationModule,
      new FastifyAdapter(),
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

  it('should setup multiple routes', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger1', app, document1);

    const document2 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger2', app, document2);

    await app.init();
    // otherwise throws "FastifyError [FST_ERR_DEC_ALREADY_PRESENT]: FST_ERR_DEC_ALREADY_PRESENT: The decorator 'swagger' has already been added!"
    await expect(
      app.getHttpAdapter().getInstance().ready()
    ).resolves.toBeDefined();
  });
});

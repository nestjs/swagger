import { NestFactory } from '@nestjs/core';
import { AzureHttpRouter } from '@nestjs/azure-func-http';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';
import { INestApplication } from '@nestjs/common';

describe.only('Azure Swagger', () => {
  let app: INestApplication;
  let builder: DocumentBuilder;

  beforeEach(async () => {
    app = await NestFactory.create<INestApplication>(
      ApplicationModule,
      new AzureHttpRouter(),
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
      .addCookieAuth()
      .addSecurityRequirements('bearer');
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

  it.only('should setup multiple routes', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger1', app, document1);

    const document2 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger2', app, document2);
    let api = await SwaggerParser.validate(document1 as any);
    let api2 = await SwaggerParser.validate(document2 as any);

    expect(api.info.title).toEqual('Cats example');
    expect(api2.info.title).toEqual('Cats example');
  });
});

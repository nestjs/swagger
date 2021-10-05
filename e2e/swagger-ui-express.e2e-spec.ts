import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as request from 'supertest';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '../lib';
import { SwaggerUiExpress } from '../lib/interfaces/swagger-ui-express.interface';
import { ApplicationModule } from './src/app.module';

describe('Swagger UI Express', () => {
  let app: INestApplication;
  let options: Omit<OpenAPIObject, 'paths'>;

  beforeEach(async () => {
    app = await NestFactory.create(ApplicationModule, {
      logger: false
    });
    app.setGlobalPrefix('api/');

    options = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .setBasePath('api')
      .addTag('cats')
      .addBasicAuth()
      .addBearerAuth()
      .addOAuth2()
      .addApiKey()
      .addApiKey({ type: 'apiKey' }, 'key1')
      .addApiKey({ type: 'apiKey' }, 'key2')
      .addCookieAuth()
      .addSecurityRequirements('bearer')
      .addSecurityRequirements({ basic: [], cookie: [] })
      .build();
  });

  it('should set up Swagger UI and OpenAPI spec on default path', async () => {
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/docs', app, document);

    await app.init();

    await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect(document);

    const swaggerUiResponse = await request(app.getHttpServer())
      .get('/docs/')
      .expect(200);

    expect(swaggerUiResponse.text.includes('<html lang="en">')).toBe(true);
  });

  it('should set up OpenAPI spec on custom path', async () => {
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/docs', app, document, {
      jsonSpecPath: '/schemas/v1/openapi.json'
    });

    await app.init();

    await request(app.getHttpServer())
      .get('/schemas/v1/openapi.json')
      .expect(200)
      .expect(document);
  });

  it('should use specified swaggerUiLib', async () => {
    const swaggerUiLib: SwaggerUiExpress = require('swagger-ui-express');
    const generateHTMLSpy = jest.spyOn(swaggerUiLib, 'generateHTML');
    const serveFilesSpy = jest.spyOn(swaggerUiLib, 'serveFiles');

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/docs', app, document, {
      swaggerUiLib
    });

    expect(generateHTMLSpy).toBeCalledWith(document, {});
    expect(serveFilesSpy).toBeCalledWith(document, {});
  });

  it('should pass options to swaggerUiLib', async () => {
    const swaggerUiLib: SwaggerUiExpress = require('swagger-ui-express');
    const generateHTMLSpy = jest.spyOn(swaggerUiLib, 'generateHTML');
    const serveFilesSpy = jest.spyOn(swaggerUiLib, 'serveFiles');

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/docs', app, document, {
      customSiteTitle: 'Custom title',
      swaggerUiLib
    });

    expect(generateHTMLSpy).toBeCalledWith(document, {
      customSiteTitle: 'Custom title'
    });
    expect(serveFilesSpy).toBeCalledWith(document, {
      customSiteTitle: 'Custom title'
    });
  });
});

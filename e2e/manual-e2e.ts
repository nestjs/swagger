import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './src/app.module';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { INestApplication, Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';

const port = 4001;
const host = 'localhost';
const docRelPath = '/api-docs';

const USE_FASTIFY = false;

const adapter = USE_FASTIFY ? new FastifyAdapter() : new ExpressAdapter();

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(
    ApplicationModule,
    adapter
  );

  app.setGlobalPrefix('/api/v1');

  const swaggerSettings = new DocumentBuilder()
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
    .addSecurityRequirements({ basic: [], cookie: [] })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerSettings, {
    deepScanRoutes: true,
    ignoreGlobalPrefix: false,
    extraModels: [] // add DTOs that are not explicitly registered here (like PaginatedDto, etc)
  });

  SwaggerModule.setup(docRelPath, app, document, {
    customSiteTitle: 'Demo API - Swagger UI 1',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1
    }
  });

  SwaggerModule.setup('/swagger-docs', app, document, {
    customSiteTitle: 'Demo API - Swagger UI 2',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1
    }
  });

  await app.listen(port, host);
  const baseUrl = `http://${host}:${port}`;
  const startMessage = `Server started at ${baseUrl}; SwaggerUI at ${
    baseUrl + docRelPath
  };`;

  Logger.log(startMessage);
}

bootstrap();

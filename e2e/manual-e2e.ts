import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './src/app.module';
import { DocumentBuilder, SwaggerModule } from '../lib';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import { INestApplication, Logger } from '@nestjs/common';
import {
  ExpressAdapter,
  NestExpressApplication
} from '@nestjs/platform-express';
import { join } from 'path';

const port = 4001;
const host = 'localhost';
const docRelPath = '/api-docs';

const USE_FASTIFY = true;
const ENABLE_BASIC_AUTH = false;

const adapter = USE_FASTIFY
  ? new FastifyAdapter({
      ignoreTrailingSlash: false
    })
  : new ExpressAdapter();
const publicFolderPath = join(__dirname, '../../e2e', 'public');

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(
    ApplicationModule,
    adapter
  );
  const httpAdapter = app.getHttpAdapter();

  ENABLE_BASIC_AUTH &&
    httpAdapter.use(docRelPath, (req, res, next) => {
      function parse(input: string): { name: string; pass: string } {
        const [, encodedPart] = input.split(' ');

        const buff = Buffer.from(encodedPart, 'base64');
        const text = buff.toString('ascii');
        const [name, pass] = text.split(':');

        return { name, pass };
      }

      function unauthorizedResponse(): void {
        if (USE_FASTIFY) {
          res.statusCode = 401;
          res.setHeader('WWW-Authenticate', 'Basic');
        } else {
          res.status(401);
          res.set('WWW-Authenticate', 'Basic');
        }

        next();
      }

      if (!req.headers.authorization) {
        return unauthorizedResponse();
      }

      const credentials = parse(req.headers.authorization);

      if (
        !credentials ||
        credentials?.name !== 'admin' ||
        credentials?.pass !== 'admin'
      ) {
        return unauthorizedResponse();
      }

      next();
    });

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
      defaultModelsExpandDepth: -1,
      syntaxHighlight: {
        activate: true,
        theme: 'tomorrow-night'
      },
      tryItOutEnabled: true
    },
    customfavIcon: '/public/favicon.ico',
    customCssUrl: '/public/theme.css' // to showcase that in new implementation u can use custom css with fastify
  });

  SwaggerModule.setup('/swagger-docs', app, document, {
    customSiteTitle: 'Demo API - Swagger UI 2',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: -1,
      tagsSorter: (a, b) => a.localeCompare(b),
      operationsSorter: (a, b) => a.get('id').localeCompare(b.get('id'))
    }
  });

  SwaggerModule.setup("/:tenantId/api-docs", app, document, {
    patchDocumentOnRequest: (req, res, document1) => ({
      ...document1,
      info: {
        ...document1.info,
        title: `${(req as Record<string, any>).params.tenantId}'s API document`
      }
    })
  })

  USE_FASTIFY
    ? (app as NestFastifyApplication).useStaticAssets({
        root: publicFolderPath,
        prefix: `/public`,
        decorateReply: false
      })
    : (app as NestExpressApplication).useStaticAssets(publicFolderPath, {
        prefix: '/public'
      });

  await app.listen(port, host);
  const baseUrl = `http://${host}:${port}`;
  const startMessage = `Server started at ${baseUrl}; SwaggerUI at ${
    baseUrl + docRelPath
  };`;

  Logger.log(startMessage);
}

bootstrap();

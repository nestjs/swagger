import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import * as swaggerUi from 'swagger-ui-express';
import {
  SwaggerBaseConfig,
  SwaggerCustomOptions,
  SwaggerDocument,
  SwaggerDocumentOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';

export class SwaggerModule {
  private static readonly swaggerScanner = new SwaggerScanner();

  public static createDocument(
    app: INestApplication,
    config: SwaggerBaseConfig,
    options: SwaggerDocumentOptions = {}
  ): SwaggerDocument {
    const document = this.swaggerScanner.scanApplication(
      app,
      options.include || []
    );
    return {
      ...config,
      ...document,
      swagger: '2.0'
    };
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: SwaggerDocument,
    options?: SwaggerCustomOptions
  ) {
    const validatePath = (path): string =>
      path.charAt(0) !== '/' ? '/' + path : path;

    const httpAdapter = app.getHttpAdapter();
    if (
      httpAdapter &&
      httpAdapter.constructor &&
      httpAdapter.constructor.name === 'FastifyAdapter'
    ) {
      return this.setupFastify(path, httpAdapter, document);
    }
    const finalPath = validatePath(path);

    const swaggerHtml = swaggerUi.generateHTML(document, options);
    app.use(finalPath, swaggerUi.serveFiles(document, options));
    app.use(finalPath, (req, res) => res.send(swaggerHtml));
    app.use(finalPath + '-json', (req, res) => res.json(document));
  }

  private static setupFastify(
    path: string,
    httpServer: any,
    document: SwaggerDocument
  ) {
    httpServer.register(loadPackage('fastify-swagger', 'SwaggerModule'), {
      swagger: document,
      exposeRoute: true,
      routePrefix: path,
      mode: 'static',
      specification: {
        document
      }
    });
  }
}

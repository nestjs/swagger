import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import {
  SwaggerBaseConfig,
  SwaggerCustomOptions,
  SwaggerDocument,
  SwaggerDocumentOptions
} from './interfaces';
import { merge } from 'lodash';
import { SwaggerScanner } from './swagger-scanner';

export class SwaggerModule {
  public static createDocument(
    app: INestApplication,
    config: SwaggerBaseConfig,
    options: SwaggerDocumentOptions = {}
  ): SwaggerDocument {
    const swaggerScanner = new SwaggerScanner();
    const document = swaggerScanner.scanApplication(
      app,
      options.include || [],
      options.deepScanRoutes
    );
    return {
      ...merge(document, config),
      swagger: '2.0'
    };
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: SwaggerDocument,
    options?: SwaggerCustomOptions
  ) {
    const httpAdapter = app.getHttpAdapter();
    if (
      httpAdapter &&
      httpAdapter.constructor &&
      httpAdapter.constructor.name === 'FastifyAdapter'
    ) {
      return this.setupFastify(path, httpAdapter, document);
    }

    return this.setupExpress(path, app, document, options);
  }

  private static setupExpress(
    path: string,
    app: INestApplication,
    document: SwaggerDocument,
    options?: SwaggerCustomOptions
  ) {
    const httpAdapter = app.getHttpAdapter();
    const validatePath = (inputPath: string): string =>
      inputPath.charAt(0) !== '/' ? '/' + inputPath : inputPath;

    const finalPath = validatePath(path);

    const swaggerUi = loadPackage('swagger-ui-express', 'SwaggerModule', () =>
      require('swagger-ui-express')
    );
    const swaggerHtml = swaggerUi.generateHTML(document, options);
    app.use(finalPath, swaggerUi.serveFiles(document, options));
    httpAdapter.get(finalPath, (req, res) => res.send(swaggerHtml));
    httpAdapter.get(finalPath + '-json', (req, res) => res.json(document));
  }

  private static setupFastify(
    path: string,
    httpServer: any,
    document: SwaggerDocument
  ) {
    httpServer.register(
      loadPackage('fastify-swagger', 'SwaggerModule', () =>
        require('fastify-swagger')
      ),
      {
        swagger: document,
        exposeRoute: true,
        routePrefix: path,
        mode: 'static',
        specification: {
          document
        }
      }
    );
  }
}

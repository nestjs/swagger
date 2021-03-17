import { INestApplication } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import {
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep';
import { validatePath } from './utils/validate-path.util';

export class SwaggerModule {
  public static createDocument(
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    options: SwaggerDocumentOptions = {}
  ): OpenAPIObject {
    const swaggerScanner = new SwaggerScanner();
    const document = swaggerScanner.scanApplication(app, options);

    document.components = assignTwoLevelsDeep(
      {},
      config.components,
      document.components
    );

    return {
      openapi: '3.0.0',
      ...config,
      ...document
    };
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: OpenAPIObject,
    options?: SwaggerCustomOptions
  ) {
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter && httpAdapter.getType() === 'fastify') {
      return this.setupFastify(path, httpAdapter, document);
    }
    return this.setupExpress(path, app, document, options);
  }

  private static setupExpress(
    path: string,
    app: INestApplication,
    document: OpenAPIObject,
    options?: SwaggerCustomOptions
  ) {
    const httpAdapter = app.getHttpAdapter();
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
    document: OpenAPIObject
  ) {
    // Workaround for older versions of the @nestjs/platform-fastify package
    // where "isParserRegistered" getter is not defined.
    const hasParserGetterDefined = (Object.getPrototypeOf(
      httpServer
    ) as Object).hasOwnProperty('isParserRegistered');
    if (hasParserGetterDefined && !httpServer.isParserRegistered) {
      httpServer.registerParserMiddleware();
    }

    httpServer.register(async (httpServer: any) => {
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
    });
  }
}

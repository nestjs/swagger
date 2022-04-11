import { INestApplication } from '@nestjs/common';
import {
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { validatePath } from './utils/validate-path.util';
import * as jsyaml from 'js-yaml';
import swaggerUi from './swagger-ui';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestExpressApplication } from '@nestjs/platform-express';

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
      paths: {},
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
    const globalPrefix = getGlobalPrefix(app);
    const finalPath = validatePath(
      options?.useGlobalPrefix && globalPrefix && !globalPrefix.match(/^(\/?)$/)
        ? `${globalPrefix}${validatePath(path)}`
        : path
    );

    const yamlDocument = jsyaml.dump(document);
    const jsonDocument = JSON.stringify(document);
    const html = swaggerUi.generateHTML(finalPath, document, options);

    const initJSFile = swaggerUi.getInitJs(document, options);

    httpAdapter.get(`${finalPath}/swagger-ui-init.js`, (req, res) => {
      res.type('application/javascript');
      res.send(initJSFile);
    });

    httpAdapter.get(finalPath, (req, res) => {
      res.type('text/html');
      res.send(html);
    });

    httpAdapter.get(finalPath + '/', (req, res) => {
      res.type('text/html');
      res.send(html);
    });

    httpAdapter.get(`${finalPath}-json`, (req, res) => {
      res.type('text/json');
      res.send(jsonDocument);
    });

    httpAdapter.get(`${finalPath}-yaml`, (req, res) => {
      res.type('text/yaml');
      res.send(yamlDocument);
    });

    // serve JS, CSS, etc
    const swaggerUIBasePath = swaggerUi.getSwaggerUiAbsoluteFSPath();
    if (httpAdapter && httpAdapter.getType() === 'fastify') {
      const fastifyApp = app as NestFastifyApplication; // TODO: figure out cleaner solution
      fastifyApp.useStaticAssets({
        root: swaggerUIBasePath,
        prefix: `${finalPath}/`,
        decorateReply: false
      });
      // fastifyApp.useStaticAssets({
      //   root: __dirname,
      //   prefix: `${finalPath}/test/`,
      //   decorateReply: false
      // });
    } else {
      const expressApp = app as NestExpressApplication; // TODO: figure out cleaner solution
      expressApp.useStaticAssets(swaggerUIBasePath, { prefix: finalPath });
    }
  }
}

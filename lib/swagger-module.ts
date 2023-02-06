import { INestApplication } from '@nestjs/common';
import { HttpServer } from '@nestjs/common/interfaces/http/http-server.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as jsyaml from 'js-yaml';
import {
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions
} from './interfaces';
import { SwaggerScanner } from './swagger-scanner';
import {
  buildSwaggerHTML,
  buildSwaggerInitJS,
  getSwaggerAssetsAbsoluteFSPath
} from './swagger-ui';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { validatePath } from './utils/validate-path.util';
import { normalizeRelPath } from './utils/normalize-rel-path';
import { validateGlobalPrefix } from './utils/validate-global-prefix.util';

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

  private static serveStatic(finalPath: string, app: INestApplication) {
    const httpAdapter = app.getHttpAdapter();
    const swaggerAssetsAbsoluteFSPath = getSwaggerAssetsAbsoluteFSPath();

    if (httpAdapter && httpAdapter.getType() === 'fastify') {
      (app as NestFastifyApplication).useStaticAssets({
        root: swaggerAssetsAbsoluteFSPath,
        prefix: finalPath,
        decorateReply: false
      });
    } else {
      (app as NestExpressApplication).useStaticAssets(
        swaggerAssetsAbsoluteFSPath,
        { prefix: finalPath }
      );
    }
  }

  private static serveDocuments(
    finalPath: string,
    urlLastSubdirectory: string,
    httpAdapter: HttpServer,
    swaggerInitJS: string,
    options: {
      html: string;
      yamlDocument: string;
      jsonDocument: string;
      jsonDocumentUrl: string;
      yamlDocumentUrl: string;
    }
  ) {
    httpAdapter.get(
      normalizeRelPath(`${finalPath}/swagger-ui-init.js`),
      (req, res) => {
        res.type('application/javascript');
        res.send(swaggerInitJS);
      }
    );

    /**
     * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
     * @see https://github.com/nestjs/swagger/issues/1976
     */
    try {
      httpAdapter.get(
        normalizeRelPath(
          `${finalPath}/${urlLastSubdirectory}/swagger-ui-init.js`
        ),
        (req, res) => {
          res.type('application/javascript');
          res.send(swaggerInitJS);
        }
      );
    } catch (err) {
      /**
       * Error is expected when urlLastSubdirectory === ''
       * in that case that route is going to be duplicating the one above
       */
    }

    httpAdapter.get(finalPath, (req, res) => {
      res.type('text/html');
      res.send(options.html);
    });

    // fastify doesn't resolve 'routePath/' -> 'routePath', that's why we handle it manually
    try {
      httpAdapter.get(normalizeRelPath(`${finalPath}/`), (req, res) => {
        res.type('text/html');
        res.send(options.html);
      });
    } catch (err) {
      /**
       * When Fastify adapter is being used with the "ignoreTrailingSlash" configuration option set to "true",
       * declaration of the route "finalPath/" will throw an error because of the following conflict:
       * Method '${method}' already declared for route '${path}' with constraints '${JSON.stringify(constraints)}.
       * We can simply ignore that error here.
       */
    }

    httpAdapter.get(normalizeRelPath(options.jsonDocumentUrl), (req, res) => {
      res.type('application/json');
      res.send(options.jsonDocument);
    });

    httpAdapter.get(normalizeRelPath(options.yamlDocumentUrl), (req, res) => {
      res.type('text/yaml');
      res.send(options.yamlDocument);
    });
  }

  public static setup(
    path: string,
    app: INestApplication,
    document: OpenAPIObject,
    options?: SwaggerCustomOptions
  ) {
    const globalPrefix = getGlobalPrefix(app);
    const finalPath = validatePath(
      options?.useGlobalPrefix && validateGlobalPrefix(globalPrefix)
        ? `${globalPrefix}${validatePath(path)}`
        : path
    );
    const urlLastSubdirectory = finalPath.split('/').slice(-1).pop();

    const yamlDocument = jsyaml.dump(document, { skipInvalid: true });
    const jsonDocument = JSON.stringify(document);

    const validatedGlobalPrefix =
      options?.useGlobalPrefix && validateGlobalPrefix(globalPrefix)
        ? validatePath(globalPrefix)
        : '';

    const finalJSONDocumentPath = options?.jsonDocumentUrl
      ? `${validatedGlobalPrefix}${validatePath(options.jsonDocumentUrl)}`
      : `${finalPath}-json`;

    const finalYAMLDocumentPath = options?.yamlDocumentUrl
      ? `${validatedGlobalPrefix}${validatePath(options.yamlDocumentUrl)}`
      : `${finalPath}-yaml`;

    const baseUrlForSwaggerUI = normalizeRelPath(`./${urlLastSubdirectory}/`);

    const html = buildSwaggerHTML(baseUrlForSwaggerUI, document, options);
    const swaggerInitJS = buildSwaggerInitJS(document, options);
    const httpAdapter = app.getHttpAdapter();

    SwaggerModule.serveDocuments(
      finalPath,
      urlLastSubdirectory,
      httpAdapter,
      swaggerInitJS,
      {
        html,
        yamlDocument,
        jsonDocument,
        jsonDocumentUrl: finalJSONDocumentPath,
        yamlDocumentUrl: finalYAMLDocumentPath
      }
    );

    SwaggerModule.serveStatic(finalPath, app);
    /**
     * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
     * @see https://github.com/nestjs/swagger/issues/1976
     */
    const serveStaticSlashEndingPath = `${finalPath}/${urlLastSubdirectory}`;
    /**
     *  serveStaticSlashEndingPath === finalPath when path === '' || path === '/'
     *  in that case we don't need to serve swagger assets on extra sub path
     */
    if (serveStaticSlashEndingPath !== finalPath) {
      SwaggerModule.serveStatic(serveStaticSlashEndingPath, app);
    }
  }
}

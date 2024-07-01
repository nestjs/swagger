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
import { MetadataLoader } from './plugin/metadata-loader';
import { SwaggerScanner } from './swagger-scanner';
import {
  buildSwaggerHTML,
  buildSwaggerInitJS,
  getSwaggerAssetsAbsoluteFSPath
} from './swagger-ui';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { normalizeRelPath } from './utils/normalize-rel-path';
import { resolvePath } from './utils/resolve-path.util';
import { validateGlobalPrefix } from './utils/validate-global-prefix.util';
import { validatePath } from './utils/validate-path.util';

export class SwaggerModule {
  private static readonly metadataLoader = new MetadataLoader();

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

  public static async loadPluginMetadata(
    metadataFn: () => Promise<Record<string, any>>
  ) {
    const metadata = await metadataFn();
    return this.metadataLoader.load(metadata);
  }

  private static serveStatic(
    finalPath: string,
    app: INestApplication,
    customStaticPath?: string
  ) {
    const httpAdapter = app.getHttpAdapter();

    // See <https://github.com/nestjs/swagger/issues/2543>
    const swaggerAssetsPath = customStaticPath
      ? resolvePath(customStaticPath)
      : getSwaggerAssetsAbsoluteFSPath();

    if (httpAdapter && httpAdapter.getType() === 'fastify') {
      (app as NestFastifyApplication).useStaticAssets({
        root: swaggerAssetsPath,
        prefix: finalPath,
        decorateReply: false
      });
    } else {
      (app as NestExpressApplication).useStaticAssets(swaggerAssetsPath, {
        prefix: finalPath
      });
    }
  }

  private static serveDocuments(
    finalPath: string,
    urlLastSubdirectory: string,
    httpAdapter: HttpServer,
    documentOrFactory: OpenAPIObject | (() => OpenAPIObject),
    options: {
      swaggerUiEnabled: boolean;
      jsonDocumentUrl: string;
      yamlDocumentUrl: string;
      swaggerOptions: SwaggerCustomOptions;
    }
  ) {
    let document: OpenAPIObject;

    const getBuiltDocument = () => {
      if (!document) {
        document =
          typeof documentOrFactory === 'function'
            ? documentOrFactory()
            : documentOrFactory;
      }
      return document;
    };

    if (options.swaggerUiEnabled) {
      this.serveSwaggerUi(
        finalPath,
        urlLastSubdirectory,
        httpAdapter,
        getBuiltDocument,
        options.swaggerOptions
      );
    }
    this.serveDefinitions(httpAdapter, getBuiltDocument, options);
  }

  private static serveSwaggerUi(
    finalPath: string,
    urlLastSubdirectory: string,
    httpAdapter: HttpServer,
    getBuiltDocument: () => OpenAPIObject,
    swaggerOptions: SwaggerCustomOptions
  ) {
    const baseUrlForSwaggerUI = normalizeRelPath(`./${urlLastSubdirectory}/`);

    let swaggerUiHtml: string;
    let swaggerUiInitJS: string;

    httpAdapter.get(
      normalizeRelPath(`${finalPath}/swagger-ui-init.js`),
      (req, res) => {
        res.type('application/javascript');
        const document = getBuiltDocument();

        if (swaggerOptions.patchDocumentOnRequest) {
          const documentToSerialize = swaggerOptions.patchDocumentOnRequest(
            req,
            res,
            document
          );
          const swaggerInitJsPerRequest = buildSwaggerInitJS(
            documentToSerialize,
            swaggerOptions
          );
          return res.send(swaggerInitJsPerRequest);
        }

        if (!swaggerUiInitJS) {
          swaggerUiInitJS = buildSwaggerInitJS(document, swaggerOptions);
        }

        res.send(swaggerUiInitJS);
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
          const document = getBuiltDocument();

          if (swaggerOptions.patchDocumentOnRequest) {
            const documentToSerialize = swaggerOptions.patchDocumentOnRequest(
              req,
              res,
              document
            );
            const swaggerInitJsPerRequest = buildSwaggerInitJS(
              documentToSerialize,
              swaggerOptions
            );
            return res.send(swaggerInitJsPerRequest);
          }

          if (!swaggerUiInitJS) {
            swaggerUiInitJS = buildSwaggerInitJS(document, swaggerOptions);
          }

          res.send(swaggerUiInitJS);
        }
      );
    } catch (err) {
      /**
       * Error is expected when urlLastSubdirectory === ''
       * in that case that route is going to be duplicating the one above
       */
    }

    httpAdapter.get(finalPath, (_, res) => {
      res.type('text/html');

      if (!swaggerUiHtml) {
        swaggerUiHtml = buildSwaggerHTML(baseUrlForSwaggerUI, swaggerOptions);
      }

      res.send(swaggerUiHtml);
    });

    // fastify doesn't resolve 'routePath/' -> 'routePath', that's why we handle it manually
    try {
      httpAdapter.get(normalizeRelPath(`${finalPath}/`), (_, res) => {
        res.type('text/html');

        if (!swaggerUiHtml) {
          swaggerUiHtml = buildSwaggerHTML(baseUrlForSwaggerUI, swaggerOptions);
        }

        res.send(swaggerUiHtml);
      });
    } catch (err) {
      /**
       * When Fastify adapter is being used with the "ignoreTrailingSlash" configuration option set to "true",
       * declaration of the route "finalPath/" will throw an error because of the following conflict:
       * Method '${method}' already declared for route '${path}' with constraints '${JSON.stringify(constraints)}.
       * We can simply ignore that error here.
       */
    }
  }

  private static serveDefinitions(
    httpAdapter: HttpServer,
    getBuiltDocument: () => OpenAPIObject,
    options: {
      jsonDocumentUrl: string;
      yamlDocumentUrl: string;
      swaggerOptions: SwaggerCustomOptions;
    }
  ) {
    httpAdapter.get(normalizeRelPath(options.jsonDocumentUrl), (req, res) => {
      res.type('application/json');
      const document = getBuiltDocument();

      const documentToSerialize = options.swaggerOptions.patchDocumentOnRequest
        ? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
        : document;

      res.send(JSON.stringify(documentToSerialize));
    });

    httpAdapter.get(normalizeRelPath(options.yamlDocumentUrl), (req, res) => {
      res.type('text/yaml');
      const document = getBuiltDocument();

      const documentToSerialize = options.swaggerOptions.patchDocumentOnRequest
        ? options.swaggerOptions.patchDocumentOnRequest(req, res, document)
        : document;

      const yamlDocument = jsyaml.dump(documentToSerialize, {
        skipInvalid: true,
        noRefs: true
      });
      res.send(yamlDocument);
    });
  }

  public static setup(
    path: string,
    app: INestApplication,
    documentOrFactory: OpenAPIObject | (() => OpenAPIObject),
    options?: SwaggerCustomOptions
  ) {
    const globalPrefix = getGlobalPrefix(app);
    const finalPath = validatePath(
      options?.useGlobalPrefix && validateGlobalPrefix(globalPrefix)
        ? `${globalPrefix}${validatePath(path)}`
        : path
    );
    const urlLastSubdirectory = finalPath.split('/').slice(-1).pop() || '';
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

    const swaggerUiEnabled = options?.swaggerUiEnabled ?? true;

    const httpAdapter = app.getHttpAdapter();

    SwaggerModule.serveDocuments(
      finalPath,
      urlLastSubdirectory,
      httpAdapter,
      documentOrFactory,
      {
        swaggerUiEnabled,
        jsonDocumentUrl: finalJSONDocumentPath,
        yamlDocumentUrl: finalYAMLDocumentPath,
        swaggerOptions: options || {}
      }
    );

    if (swaggerUiEnabled) {
      SwaggerModule.serveStatic(finalPath, app, options?.customSwaggerUiPath);
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
}

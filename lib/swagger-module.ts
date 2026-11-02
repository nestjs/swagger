import {
  INestApplication,
  Logger,
  NotFoundException,
  RequestMethod
} from '@nestjs/common';
import { HttpServer } from '@nestjs/common/interfaces/http/http-server.interface.js';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as jsyaml from 'js-yaml';
import { posix } from 'path';
import {
  GLOBAL_PARAMETERS,
  GLOBAL_RESPONSES,
  GlobalMetadataHost
} from './interfaces/global-metadata.interface.js';
import {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions
} from './interfaces/index.js';
import { MetadataLoader } from './plugin/metadata-loader.js';
import { SwaggerScanner } from './swagger-scanner.js';
import {
  buildSwaggerHTML,
  buildSwaggerInitJS,
  getSwaggerAssetsAbsoluteFSPath
} from './swagger-ui/index.js';
import { assignTwoLevelsDeep } from './utils/assign-two-levels-deep.js';
import { getGlobalPrefix } from './utils/get-global-prefix.js';
import { isOas31OrLater } from './utils/is-oas31-or-later.util.js';
import { isOas32OrLater } from './utils/is-oas32-or-later.util.js';
import { normalizeRelPath } from './utils/normalize-rel-path.js';
import { convertNullableToOas31 } from './utils/nullable-to-oas31.util.js';
import { removeDanglingLinks } from './utils/remove-dangling-links.util.js';
import { resolvePath } from './utils/resolve-path.util.js';
import { validateGlobalPrefix } from './utils/validate-global-prefix.util.js';
import { validatePath } from './utils/validate-path.util.js';

/**
 * Whether a path segment is a route parameter or wildcard (`:tenant`, `*`)
 * rather than a literal.
 */
const isRoutePattern = (segment: string) => /[:*]/.test(segment);

/**
 * Whether a path below a static assets prefix points at a file of the
 * "swagger-ui-dist" package that is not part of the UI: its demo page (set up
 * for the petstore example) or its license. The path is decoded and normalized
 * the way the static file servers do, and compared case-insensitively since the
 * file system may be.
 */
function isStockSwaggerUiFile(pathname: string): boolean {
  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  const normalizedPathname = posix
    .normalize(`/${decodedPathname}`)
    .toLowerCase();
  return (
    normalizedPathname === '/index.html' || normalizedPathname === '/license'
  );
}

const FIXED_PATH_ITEM_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace'
];

/**
 * HTTP methods Nest can route that lack a fixed Path Item field (`query` only
 * has one since OpenAPI 3.2).
 */
const NON_STANDARD_HTTP_METHODS = new Set(
  Object.values(RequestMethod)
    .filter((method): method is string => typeof method === 'string')
    .map((method) => method.toLowerCase())
    .filter(
      (method) => method !== 'all' && !FIXED_PATH_ITEM_METHODS.includes(method)
    )
);

/**
 * @publicApi
 */
export class SwaggerModule {
  private static readonly metadataLoader = new MetadataLoader();

  private static mergeWebhooks(
    configWebhooks?: OpenAPIObject['webhooks'],
    scannedWebhooks?: OpenAPIObject['webhooks']
  ): OpenAPIObject['webhooks'] | undefined {
    if (!configWebhooks && !scannedWebhooks) {
      return undefined;
    }
    return assignTwoLevelsDeep({}, configWebhooks || {}, scannedWebhooks || {});
  }

  /**
   * Path Items only have fixed fields for the standard HTTP methods (plus
   * `query` since OpenAPI 3.2). Operations for any other method Nest can route
   * (e.g. `SEARCH` or the WebDAV methods) are moved under `additionalOperations`
   * for OpenAPI >= 3.2 and dropped from older documents, along with any path
   * item that ends up empty.
   */
  private static normalizeNonStandardOperations<
    T extends Record<string, PathItemObject>
  >(pathItems: T, isOas32: boolean): T {
    const isNonStandard = (field: string) =>
      NON_STANDARD_HTTP_METHODS.has(field) && !(isOas32 && field === 'query');

    const result: Record<string, PathItemObject> = {};
    for (const [key, pathItem] of Object.entries(pathItems)) {
      if (!pathItem || !Object.keys(pathItem).some(isNonStandard)) {
        result[key] = pathItem;
        continue;
      }
      const rest: Record<string, unknown> = {};
      const additionalOperations: Record<string, OperationObject> = {
        ...pathItem.additionalOperations
      };
      for (const [field, value] of Object.entries(pathItem)) {
        if (!isNonStandard(field)) {
          rest[field] = value;
        } else if (isOas32) {
          additionalOperations[field.toUpperCase()] = value;
        }
      }
      if (isOas32) {
        rest.additionalOperations = additionalOperations;
      }
      if (Object.keys(rest).length > 0) {
        result[key] = rest as PathItemObject;
      }
    }
    return result as T;
  }

  public static createDocument(
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    options: SwaggerDocumentOptions = {}
  ): OpenAPIObject {
    const {
      webhooks: configWebhooks,
      [GLOBAL_PARAMETERS]: globalParameters,
      [GLOBAL_RESPONSES]: globalResponses,
      ...configWithoutWebhooks
    } = config as OpenAPIObject & GlobalMetadataHost;
    const swaggerScanner = new SwaggerScanner();
    const document = swaggerScanner.scanApplication(app, options, {
      globalParameters,
      globalResponses
    });

    document.components = assignTwoLevelsDeep(
      {},
      config.components,
      document.components
    );
    const {
      webhooks: scannedWebhooks,
      webhookPaths,
      ...documentWithoutWebhooks
    } = document as OpenAPIObject & {
      webhookPaths?: OpenAPIObject['paths'];
    };
    const mergedWebhooks = SwaggerModule.mergeWebhooks(
      configWebhooks,
      scannedWebhooks
    );
    const openApiVersion = config.openapi ?? '3.0.0';
    const isOas31 = isOas31OrLater(openApiVersion);
    const baseDocument: OpenAPIObject = {
      openapi: '3.0.0',
      paths: {},
      ...configWithoutWebhooks,
      ...documentWithoutWebhooks
    };

    // Webhooks only exist as a top-level field since 3.1; older documents keep
    // them as regular paths. A webhook handler must only add to the paths, not
    // replace a regular operation sharing its path and method, so the regular
    // paths are applied once more on top.
    if (!isOas31 && webhookPaths) {
      for (const [path, webhookPathItem] of Object.entries(webhookPaths)) {
        for (const method of Object.keys(webhookPathItem)) {
          if (baseDocument.paths?.[path]?.[method]) {
            new Logger(SwaggerModule.name).warn(
              `Webhook "${method.toUpperCase()} ${path}" shares its path and method with a route, so it is left out of the OpenAPI ${openApiVersion} document. Use OpenAPI 3.1 or later to document both.`
            );
          }
        }
      }
    }
    const finalDocument: OpenAPIObject = isOas31
      ? {
          ...baseDocument,
          ...(mergedWebhooks ? { webhooks: mergedWebhooks } : {})
        }
      : {
          ...baseDocument,
          paths: webhookPaths
            ? assignTwoLevelsDeep(
                {},
                baseDocument.paths || {},
                webhookPaths,
                baseDocument.paths || {}
              )
            : baseDocument.paths
        };

    if (isOas31) {
      // 3.1 is JSON Schema 2020-12, which removed the "nullable" keyword.
      convertNullableToOas31(finalDocument);
    }

    const isOas32 = isOas32OrLater(openApiVersion);
    finalDocument.paths = SwaggerModule.normalizeNonStandardOperations(
      finalDocument.paths,
      isOas32
    );
    if (finalDocument.webhooks) {
      finalDocument.webhooks = SwaggerModule.normalizeNonStandardOperations(
        finalDocument.webhooks,
        isOas32
      );
    }
    removeDanglingLinks(finalDocument);

    return finalDocument;
  }

  public static async loadPluginMetadata(
    metadataFn: () => Promise<Record<string, any>>
  ) {
    const metadata = await metadataFn();
    return this.metadataLoader.load(metadata);
  }

  protected static serveStatic(
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
      // `@fastify/static` is reached through a dynamic import with a literal
      // specifier so that bundlers can follow it. A `createRequire` call is
      // opaque to every major bundler, which left the package out of bundled
      // output and made `SwaggerModule` fail at runtime in artifact-only
      // deployments that have no `node_modules` to fall back on (#4099).
      //
      // Fastify resolves async plugins during `ready()`, so awaiting the
      // import inside one keeps `serveStatic` — and therefore the public
      // `setup()` — synchronous.
      httpAdapter.getInstance().register(async (instance) => {
        const fastifyStaticModule = await loadPackage(
          '@fastify/static',
          'SwaggerModule',
          () => import('@fastify/static')
        );
        // The package may be published as either CommonJS or ESM.
        const fastifyStatic =
          fastifyStaticModule.default ?? fastifyStaticModule;

        instance.register(fastifyStatic, {
          root: swaggerAssetsPath,
          prefix: finalPath,
          decorateReply: false,
          index: false,
          allowedPath: (pathname: string) => !isStockSwaggerUiFile(pathname)
        });
      });
    } else {
      app.use(finalPath, (req: any, res: any, next: Function) =>
        isStockSwaggerUiFile(req.path) ? next(new NotFoundException()) : next()
      );
      (app as NestExpressApplication).useStaticAssets(swaggerAssetsPath, {
        prefix: finalPath,
        index: false
      });
    }
  }

  protected static serveDocuments(
    finalPath: string,
    urlLastSubdirectory: string,
    httpAdapter: HttpServer,
    documentOrFactory: OpenAPIObject | (() => OpenAPIObject),
    options: {
      ui: boolean;
      raw: boolean | Array<'json' | 'yaml'>;
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

    if (options.ui) {
      this.serveSwaggerUi(
        finalPath,
        urlLastSubdirectory,
        httpAdapter,
        getBuiltDocument,
        options.swaggerOptions
      );
    }

    /**
     * Serve JSON/YAML definitions based on the `raw` option:
     * - `true`: Serve both JSON and YAML definitions.
     * - `false`: Skip registering both JSON and YAML definitions.
     * - `Array<'json' | 'yaml'>`: Serve only the specified formats (e.g., `['json']` to serve only JSON).
     */
    if (
      options.raw === true ||
      (Array.isArray(options.raw) && options.raw.length > 0)
    ) {
      const serveJson = options.raw === true || options.raw.includes('json');
      const serveYaml = options.raw === true || options.raw.includes('yaml');

      this.serveDefinitions(httpAdapter, getBuiltDocument, options, {
        serveJson,
        serveYaml
      });
    }
  }

  protected static serveSwaggerUi(
    finalPath: string,
    urlLastSubdirectory: string,
    httpAdapter: HttpServer,
    getBuiltDocument: () => OpenAPIObject,
    swaggerOptions: SwaggerCustomOptions
  ) {
    const baseUrlForSwaggerUI = normalizeRelPath(`./${urlLastSubdirectory}/`);

    let swaggerUiHtml: string;
    let swaggerUiHtmlForTrailingSlash: string;
    let swaggerUiInitJS: string;

    async function serveSwaggerInitJs(req: any, res: any) {
      res.type('application/javascript');
      const document = getBuiltDocument();

      if (swaggerOptions.patchDocumentOnRequest) {
        const documentToSerialize = await Promise.resolve(
          swaggerOptions.patchDocumentOnRequest(req, res, document)
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

      return res.send(swaggerUiInitJS);
    }

    httpAdapter.get(
      normalizeRelPath(`${finalPath}/swagger-ui-init.js`),
      serveSwaggerInitJs
    );

    /**
     * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
     * Skipped when the last segment is a route parameter: repeating it
     * ("/docs/:tenant/:tenant/...") would let its second match override the
     * value an authorization layer on the prefix saw.
     * @see https://github.com/nestjs/swagger/issues/1976
     */
    if (!isRoutePattern(urlLastSubdirectory)) {
      try {
        httpAdapter.get(
          normalizeRelPath(
            `${finalPath}/${urlLastSubdirectory}/swagger-ui-init.js`
          ),
          serveSwaggerInitJs
        );
      } catch {
        /**
         * Error is expected when urlLastSubdirectory === ''
         * in that case that route is going to be duplicating the one above
         */
      }
    }

    const getSwaggerHtml = () => {
      if (!swaggerUiHtml) {
        swaggerUiHtml = buildSwaggerHTML(baseUrlForSwaggerUI, swaggerOptions);
      }
      return swaggerUiHtml;
    };

    const getTrailingSlashSwaggerHtml = () => {
      if (!swaggerUiHtmlForTrailingSlash) {
        swaggerUiHtmlForTrailingSlash = buildSwaggerHTML('./', swaggerOptions);
      }
      return swaggerUiHtmlForTrailingSlash;
    };

    function serveSwaggerHtml(req: any, res: any) {
      res.type('text/html');

      const [pathname] = httpAdapter.getRequestUrl(req).split('?');
      const isFolderUrl =
        pathname.endsWith('/') || pathname.endsWith('/index.html');
      const swaggerUiHtml = isFolderUrl
        ? getTrailingSlashSwaggerHtml()
        : getSwaggerHtml();
      res.send(swaggerUiHtml);
    }

    httpAdapter.get(finalPath, serveSwaggerHtml);
    httpAdapter.get(`${finalPath}/index.html`, serveSwaggerHtml);
    httpAdapter.get(`${finalPath}/LICENSE`, () => {
      throw new NotFoundException();
    });

    // fastify doesn't resolve 'routePath/' -> 'routePath', that's why we handle it manually
    try {
      httpAdapter.get(normalizeRelPath(`${finalPath}/`), serveSwaggerHtml);
    } catch {
      /**
       * When Fastify adapter is being used with the "ignoreTrailingSlash" configuration option set to "true",
       * declaration of the route "finalPath/" will throw an error because of the following conflict:
       * Method '${method}' already declared for route '${path}' with constraints '${JSON.stringify(constraints)}.
       * We can simply ignore that error here.
       */
    }
  }

  protected static serveDefinitions(
    httpAdapter: HttpServer,
    getBuiltDocument: () => OpenAPIObject,
    options: {
      jsonDocumentUrl: string;
      yamlDocumentUrl: string;
      swaggerOptions: SwaggerCustomOptions;
    },
    serveOptions: { serveJson: boolean; serveYaml: boolean }
  ) {
    if (serveOptions.serveJson) {
      httpAdapter.get(
        normalizeRelPath(options.jsonDocumentUrl),
        async (req, res) => {
          res.type('application/json');
          const document = getBuiltDocument();

          const documentToSerialize = options.swaggerOptions
            .patchDocumentOnRequest
            ? await Promise.resolve(
                options.swaggerOptions.patchDocumentOnRequest(
                  req,
                  res,
                  document
                )
              )
            : document;

          return res.send(JSON.stringify(documentToSerialize));
        }
      );
    }

    if (serveOptions.serveYaml) {
      httpAdapter.get(
        normalizeRelPath(options.yamlDocumentUrl),
        async (req, res) => {
          res.type('text/yaml');
          const document = getBuiltDocument();

          const documentToSerialize = options.swaggerOptions
            .patchDocumentOnRequest
            ? await Promise.resolve(
                options.swaggerOptions.patchDocumentOnRequest(
                  req,
                  res,
                  document
                )
              )
            : document;

          const yamlDocument = jsyaml.dump(documentToSerialize, {
            skipInvalid: true,
            noRefs: true
          });
          return res.send(yamlDocument);
        }
      );
    }
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

    const ui = options?.ui ?? options?.swaggerUiEnabled ?? true;
    const raw = options?.raw ?? true;

    const httpAdapter = app.getHttpAdapter();

    SwaggerModule.serveDocuments(
      finalPath,
      urlLastSubdirectory,
      httpAdapter,
      documentOrFactory,
      {
        ui,
        raw,
        jsonDocumentUrl: finalJSONDocumentPath,
        yamlDocumentUrl: finalYAMLDocumentPath,
        swaggerOptions: options || {}
      }
    );

    if (ui) {
      SwaggerModule.serveStatic(finalPath, app, options?.customSwaggerUiPath);
      /**
       * Covers assets fetched through a relative path when Swagger url ends with a slash '/'.
       * @see https://github.com/nestjs/swagger/issues/1976
       */
      if (
        isRoutePattern(urlLastSubdirectory) ||
        finalPath === `/${urlLastSubdirectory}`
      ) {
        return;
      }
      const serveStaticSlashEndingPath = `${finalPath}/${urlLastSubdirectory}`;
      SwaggerModule.serveStatic(
        serveStaticSlashEndingPath,
        app,
        options?.customSwaggerUiPath
      );
    }
  }
}

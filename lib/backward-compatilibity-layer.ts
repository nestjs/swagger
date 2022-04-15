import {
  FastifySwaggerCustomOptions,
  SwaggerCustomOptions,
  LegacySwaggerCustomOptions
} from './interfaces';
import { HttpServer } from '@nestjs/common/interfaces/http/http-server.interface';

export interface FastifyExtra {
  initOAuth?: Record<string, any>;
  staticCSP?: boolean | string | Record<string, string | string[]>;
  transformStaticCSP?: (header: string) => string;
  uiHooks?: {
    onRequest?: Function;
    preHandler?: Function;
  };
}

export interface ProcessSwaggerOptionsOutput {
  customOptions: SwaggerCustomOptions;
  extra: FastifyExtra;
}

export function processSwaggerOptions(
  options: LegacySwaggerCustomOptions = {}
): ProcessSwaggerOptionsOutput {
  const unifiedOptions: SwaggerCustomOptions = options;
  const fastifyOptions: FastifySwaggerCustomOptions = options;

  const customOptions: SwaggerCustomOptions = {
    useGlobalPrefix: unifiedOptions.useGlobalPrefix,
    explorer: unifiedOptions.explorer,
    customCss: unifiedOptions.customCss,
    customCssUrl: unifiedOptions.customCssUrl,
    customJs: unifiedOptions.customJs,
    customfavIcon: unifiedOptions.customfavIcon,
    swaggerUrl: unifiedOptions.swaggerUrl,
    customSiteTitle: unifiedOptions.customSiteTitle,
    validatorUrl: unifiedOptions.validatorUrl,
    url: unifiedOptions.url,
    urls: unifiedOptions.urls,
    initOAuth: unifiedOptions.initOAuth,

    swaggerOptions: unifiedOptions.swaggerOptions || fastifyOptions.uiConfig
  };

  const extra = {
    uiHooks: fastifyOptions.uiHooks
  };

  return { customOptions, extra };
}

export function serveDocumentsFastify(
  finalPath: string,
  httpAdapter: HttpServer,
  swaggerInitJS: string,
  yamlDocument: string,
  jsonDocument: string,
  html: string,
  fastifyExtras: FastifyExtra
) {
  const httpServer = httpAdapter as any;

  // Workaround for older versions of the @nestjs/platform-fastify package
  // where "isParserRegistered" getter is not defined.
  const hasParserGetterDefined = (
    Object.getPrototypeOf(httpServer) as Object
  ).hasOwnProperty('isParserRegistered');
  if (hasParserGetterDefined && !httpServer.isParserRegistered) {
    httpServer.registerParserMiddleware();
  }

  httpServer.register(async (fastifyApp: any) => {
    const hooks = Object.create(null);

    if (fastifyExtras.uiHooks) {
      const additionalHooks = ['onRequest', 'preHandler'];
      for (const hook of additionalHooks) {
        hooks[hook] = fastifyExtras.uiHooks[hook];
      }
    }

    fastifyApp.route({
      url: finalPath,
      method: 'GET',
      schema: { hide: true },
      ...hooks,
      handler: (req: any, reply: any) => {
        reply.type('text/html');
        reply.send(html);
      }
    });

    fastifyApp.route({
      url: `${finalPath}/swagger-ui-init.js`,
      method: 'GET',
      schema: { hide: true },
      ...hooks,
      handler: (req: any, reply: any) => {
        reply.type('application/javascript');
        reply.send(swaggerInitJS);
      }
    });

    fastifyApp.route({
      url: `${finalPath}-json`,
      method: 'GET',
      schema: { hide: true },
      ...hooks,
      handler: (req: any, reply: any) => {
        reply.type('text/json');
        reply.send(jsonDocument);
      }
    });

    fastifyApp.route({
      url: `${finalPath}-yaml`,
      method: 'GET',
      schema: { hide: true },
      ...hooks,
      handler: (req: any, reply: any) => {
        reply.type('text/yaml');
        reply.send(yamlDocument);
      }
    });
  });
}

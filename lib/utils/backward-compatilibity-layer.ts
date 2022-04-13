import {
  FastifySwaggerCustomOptions,
  SwaggerCustomOptions,
  SwaggerCustomOptionsLegacy
} from '../interfaces';

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
  options: SwaggerCustomOptionsLegacy = {}
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

    swaggerOptions: unifiedOptions.swaggerOptions || fastifyOptions.uiConfig
  };

  const extra = {
    initOAuth: fastifyOptions.initOAuth,
    uiHooks: fastifyOptions.uiHooks
  };

  return { customOptions, extra };
}

interface _CommonSwaggerCustomOptions {
  useGlobalPrefix?: boolean;
}

export interface ExpressSwaggerCustomOptions
  extends _CommonSwaggerCustomOptions {
  explorer?: boolean;
  swaggerOptions?: Record<string, any>;
  customCss?: string;
  customCssUrl?: string;
  customJs?: string;
  customfavIcon?: string;
  swaggerUrl?: string;
  customSiteTitle?: string;
  validatorUrl?: string;
  url?: string;
  urls?: Record<'url' | 'name', string>[];
}

/*
 * @deprecated
 */
export interface FastifySwaggerCustomOptions
  extends _CommonSwaggerCustomOptions {
  uiConfig?: Partial<{
    deepLinking: boolean;
    displayOperationId: boolean;
    defaultModelsExpandDepth: number;
    defaultModelExpandDepth: number;
    defaultModelRendering: string;
    displayRequestDuration: boolean;
    docExpansion: string;
    filter: boolean | string;
    layout: string;
    maxDisplayedTags: number;
    showExtensions: boolean;
    showCommonExtensions: boolean;
    useUnsafeMarkdown: boolean;
    syntaxHighlight:
      | {
          activate?: boolean;
          theme?: string;
        }
      | false;
    tryItOutEnabled: boolean;
    validatorUrl: string | null;
    persistAuthorization: boolean;
    tagsSorter: string;
    operationsSorter: string;
    queryConfigEnabled: boolean;
  }>;
  initOAuth?: Record<string, any>;
  staticCSP?: boolean | string | Record<string, string | string[]>; // not supported
  transformStaticCSP?: (header: string) => string; // not supported
  uiHooks?: {
    onRequest?: Function;
    preHandler?: Function;
  };
}

/*
 * TODO: remove entire file when FastifySwaggerCustomOptions backward compatibility layer is no longer needed
 *       and use SwaggerCustomOptions in SwaggerModule.setup
 */
export type SwaggerCustomOptionsLegacy =
  | FastifySwaggerCustomOptions
  | ExpressSwaggerCustomOptions;

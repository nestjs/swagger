interface CommonSwaggerCustomOptions {
  useGlobalPrefix?: boolean,
}

export interface ExpressSwaggerCustomOptions extends CommonSwaggerCustomOptions {
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

export interface FastifySwaggerCustomOptions extends CommonSwaggerCustomOptions {
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
  }>;
  initOAuth?: Record<string, any>;
  staticCSP?: boolean | string | Record<string, string | string[]>;
  transformStaticCSP?: (header: string) => string;
}

export type SwaggerCustomOptions =
  | FastifySwaggerCustomOptions
  | ExpressSwaggerCustomOptions;

import { SwaggerUIOptions } from "./express-swagger-ui-custom-options.interface";

interface CommonSwaggerCustomOptions {
  useGlobalPrefix?: boolean,
}

export interface ExpressSwaggerOptions {
  /**
   * [OAuth 2.0 configuration](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/oauth2.md#oauth-20-configuration)
   * 
   * This object is passed to the `initOAuth` method in `swagger-ui` library
   *
   * @type {Partial<SwaggerUIOptions>}
   */
  oauth?: Partial<SwaggerUIOptions>
}

export interface ExpressSwaggerCustomOptions extends CommonSwaggerCustomOptions {
  /**
   * See Swagger Configuration [documentation](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md#configuration) 
   *
   * @type {(Record<string, any> & Partial<ExpressSwaggerOptions>)}
   * @memberof ExpressSwaggerCustomOptions
   */
  swaggerOptions?: Record<string, any> & Partial<ExpressSwaggerOptions>;
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
    persistAuthorization: boolean;
  }>;
  initOAuth?: Record<string, any>;
  staticCSP?: boolean | string | Record<string, string | string[]>;
  transformStaticCSP?: (header: string) => string;
}

export type SwaggerCustomOptions =
  | FastifySwaggerCustomOptions
  | ExpressSwaggerCustomOptions;

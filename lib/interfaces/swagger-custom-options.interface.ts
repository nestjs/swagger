import {
  ExpressSwaggerUiLib,
  ExpressSwaggerUiLibOptions
} from './swagger-ui-express-lib.interface';

interface CommonSwaggerCustomOptions {
  useGlobalPrefix?: boolean;
}

export interface ExpressSwaggerCustomOptions
  extends CommonSwaggerCustomOptions,
    ExpressSwaggerUiLibOptions {
  jsonSpecPath?: string;
  swaggerUiLib?: ExpressSwaggerUiLib;
}

export interface FastifySwaggerCustomOptions
  extends CommonSwaggerCustomOptions {
  uiConfig?: Partial<{
    deepLinking: boolean;
    displayOperationId: boolean;
    defaultModelsExpandDepth: number;
    defaultModelExpandDepth: number;
    defaultModelRendering: string;
    displayRequestDuration: boolean;
    docExpansion: string;
    filter: boolean | string;
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

import { SwaggerUiOptions } from './swagger-ui-options.interface';
import { SwaggerDocumentOptions } from './swagger-document-options.interface';
import { OpenAPIObject } from './open-api-spec.interface';

export interface CustomCssUrl {
  customCssUrl: string | string[];
  customCssUrlIntegrity?: string | string[];
}

export interface CustomJs {
  customJs: string | string[];
  customJsIntegrity?: string | string[];
}

export interface CustomJsStr {
  customJsStr: string | string[];
  customJsStrIntegrity?: string | string[];
}

export interface SwaggerCustomOptions {
  useGlobalPrefix?: boolean;
  explorer?: boolean;
  swaggerOptions?: SwaggerUiOptions;
  customCss?: string;
  customCssUrl?: CustomCssUrl;
  customJs?: CustomJs;
  customJsStr?: CustomJsStr;
  customfavIcon?: string;
  customSwaggerUiPath?: string;
  swaggerUrl?: string;
  customSiteTitle?: string;
  validatorUrl?: string;
  url?: string;
  urls?: Record<'url' | 'name', string>[];
  jsonDocumentUrl?: string;
  yamlDocumentUrl?: string;
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;
}

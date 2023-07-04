import { SwaggerUiOptions } from './swagger-ui-options.interface';
import { SwaggerDocumentOptions } from './swagger-document-options.interface';
import { OpenAPIObject } from './open-api-spec.interface';

export interface SwaggerCustomOptions {
  useGlobalPrefix?: boolean;
  explorer?: boolean;
  swaggerOptions?: SwaggerUiOptions;
  customCss?: string;
  customCssUrl?: string | string[];
  customJs?: string | string[];
  customJsStr?: string | string[];
  customfavIcon?: string;
  swaggerUrl?: string;
  customSiteTitle?: string;
  validatorUrl?: string;
  url?: string;
  urls?: Record<'url' | 'name', string>[];
  jsonDocumentUrl?: string;
  yamlDocumentUrl?: string;
  patchDocumentOnRequest?: <TRequest = any, TResponse = any> (req: TRequest, res: TResponse, document: OpenAPIObject) => OpenAPIObject;
}

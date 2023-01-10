import { SwaggerUiOptions } from './swagger-ui-options.interface';

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
}

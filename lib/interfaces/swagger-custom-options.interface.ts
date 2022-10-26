import { SwaggerUiOptions } from './swagger-ui-options.interface';

export interface SwaggerCustomOptions {
  useGlobalPrefix?: boolean;
  explorer?: boolean;
  swaggerOptions?: SwaggerUiOptions;
  customCss?: string;
  customCssUrl?: string;
  customJs?: string;
  customJsStr?: string;
  customfavIcon?: string;
  swaggerUrl?: string;
  customSiteTitle?: string;
  validatorUrl?: string;
  url?: string;
  urls?: Record<'url' | 'name', string>[];
}

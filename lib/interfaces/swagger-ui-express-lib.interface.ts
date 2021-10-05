import { OpenAPIObject } from './open-api-spec.interface';

export interface ExpressSwaggerUiLibOptions {
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

export interface ExpressSwaggerUiLib {
  generateHTML(
    document: OpenAPIObject,
    swaggerUiOptions: ExpressSwaggerUiLibOptions
  ): string;

  serveFiles(
    document: OpenAPIObject,
    swaggerUiOptions: ExpressSwaggerUiLibOptions
  ): any;
}

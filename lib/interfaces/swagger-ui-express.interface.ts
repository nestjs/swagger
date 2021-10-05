import { OpenAPIObject } from './open-api-spec.interface';

export interface SwaggerUiExpressOptions {
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

export interface SwaggerUiExpress {
  generateHTML(
    document: OpenAPIObject,
    options: SwaggerUiExpressOptions
  ): string;

  serveFiles(document: OpenAPIObject, options: SwaggerUiExpressOptions): any;
}

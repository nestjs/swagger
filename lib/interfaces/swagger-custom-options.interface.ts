import { SwaggerUiOptions } from './swagger-ui-options.interface';
import { OpenAPIObject } from './open-api-spec.interface';

export interface SwaggerCustomOptions {
  /**
   * If `true`, Swagger resources paths will be prefixed by the global prefix set through `setGlobalPrefix()`.
   * Default: `false`.
   * @see https://docs.nestjs.com/faq/global-prefix
   */
  useGlobalPrefix?: boolean;

  /**
   * If `false`, only API definitions (JSON and YAML) will be served (on `/{path}-json` and `/{path}-yaml`).
   * This is particularly useful if you are already hosting a Swagger UI somewhere else and just want to serve API definitions.
   * Default: `true`.
   */
  swaggerUiEnabled?: boolean;

  /**
   * Url point the API definition to load in Swagger UI.
   */
  swaggerUrl?: string;

  /**
   * Path of the JSON API definition to serve.
   * Default: `{{path}}-json`.
   */
  jsonDocumentUrl?: string;

  /**
   * Path of the YAML API definition to serve.
   * Default: `{{path}}-json`.
   */
  yamlDocumentUrl?: string;

  /**
   * Hook allowing to alter the OpenAPI document before being served.
   * It's called after the document is generated and before it is served as JSON & YAML.
   */
  patchDocumentOnRequest?: <TRequest = any, TResponse = any>(
    req: TRequest,
    res: TResponse,
    document: OpenAPIObject
  ) => OpenAPIObject;

  /**
   * If `true`, the selector of OpenAPI definitions is displayed in the Swagger UI interface.
   * Default: `false`.
   */
  explorer?: boolean;

  /**
   * Additional Swagger UI options
   */
  swaggerOptions?: SwaggerUiOptions;

  /**
   * Custom CSS styles to inject in Swagger UI page.
   */
  customCss?: string;

  /**
   * URL(s) of a custom CSS stylesheet to load in Swagger UI page.
   */
  customCssUrl?: string | string[];

  /**
   * URL(s) of custom JavaScript files to load in Swagger UI page.
   */
  customJs?: string | string[];

  /**
   * Custom JavaScript scripts to load in Swagger UI page.
   */
  customJsStr?: string | string[];

  /**
   * Custom favicon for Swagger UI page.
   */
  customfavIcon?: string;

  /**
   * Custom title for Swagger UI page.
   */
  customSiteTitle?: string;

  /**
   * File system path (ex: ./node_modules/swagger-ui-dist) containing static Swagger UI assets.
   */
  customSwaggerUiPath?: string;

  /**
   * @deprecated This property has no effect.
   */
  validatorUrl?: string;

  /**
   * @deprecated This property has no effect.
   */
  url?: string;

  /**
   * @deprecated This property has no effect.
   */
  urls?: Record<'url' | 'name', string>[];

}

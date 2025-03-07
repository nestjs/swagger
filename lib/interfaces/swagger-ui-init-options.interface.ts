import { OpenAPIObject } from './open-api-spec.interface';
import { SwaggerUiOptions } from './swagger-ui-options.interface';

/**
 * @publicApi
 */
export interface SwaggerUIInitOptions {
  swaggerDoc: OpenAPIObject;
  customOptions: SwaggerUiOptions;
  swaggerUrl: string;
}

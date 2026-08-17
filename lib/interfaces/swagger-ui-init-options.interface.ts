import { OpenAPIObject } from './open-api-spec.interface.js';
import { SwaggerUiOptions } from './swagger-ui-options.interface.js';

/**
 * @publicApi
 */
export interface SwaggerUIInitOptions {
  swaggerDoc: OpenAPIObject;
  customOptions: SwaggerUiOptions;
  swaggerUrl: string;
}

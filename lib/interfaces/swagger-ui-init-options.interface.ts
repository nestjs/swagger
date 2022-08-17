import { SwaggerCustomOptions } from './swagger-custom-options.interface';
import { OpenAPIObject } from './open-api-spec.interface';

export interface SwaggerUIInitOptions {
  swaggerDoc: OpenAPIObject;
  customOptions: SwaggerCustomOptions;
  swaggerUrl: string;
}

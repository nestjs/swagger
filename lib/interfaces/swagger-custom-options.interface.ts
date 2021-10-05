import {
  ExpressSwaggerUiLib,
  ExpressSwaggerUiLibOptions
} from './swagger-ui-express-lib.interface';

export interface ExpressSwaggerCustomOptions
  extends ExpressSwaggerUiLibOptions {
  jsonSpecPath?: string;
  swaggerUiLib?: ExpressSwaggerUiLib;
}

export interface FastifySwaggerCustomOptions {
  uiConfig?: Record<string, any>;
}

export type SwaggerCustomOptions =
  | FastifySwaggerCustomOptions
  | ExpressSwaggerCustomOptions;

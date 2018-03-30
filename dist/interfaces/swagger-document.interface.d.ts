import { SwaggerBaseConfig } from './swagger-base-config.interface';
export interface SwaggerDocument extends SwaggerBaseConfig {
  definitions: any;
  paths: any;
}

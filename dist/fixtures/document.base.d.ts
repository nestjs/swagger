import { SwaggerScheme } from '../interfaces/swagger-base-config.interface';
export declare const documentBase: {
  swagger: string;
  info: {
    description: string;
    version: string;
    title: string;
  };
  basePath: string;
  tags: any[];
  schemes: SwaggerScheme[];
  securityDefinitions: {};
};

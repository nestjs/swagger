import { SwaggerEnum } from '../interfaces/swagger-enum.interface';

export type SwaggerEnumType =
  | string[]
  | number[]
  | (string | number)[]
  | SwaggerEnum;

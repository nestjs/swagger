import { ParameterObject } from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
export interface ApiHeaderOptions extends Omit<ParameterObject, 'in'> {
    enum?: SwaggerEnumType;
}
export declare function ApiHeader(options: ApiHeaderOptions): MethodDecorator & ClassDecorator;
export declare const ApiHeaders: (headers: ApiHeaderOptions[]) => MethodDecorator & ClassDecorator;

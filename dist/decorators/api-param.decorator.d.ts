import { Type } from '@nestjs/common';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import { ParameterObject, SchemaObject } from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
type ParameterOptions = Omit<ParameterObject, 'in' | 'schema'>;
interface ApiParamCommonMetadata extends ParameterOptions {
    type?: Type<unknown> | Function | [Function] | string;
    format?: string;
    enum?: SwaggerEnumType;
    enumName?: string;
    enumSchema?: EnumSchemaAttributes;
}
type ApiParamMetadata = ApiParamCommonMetadata | (ApiParamCommonMetadata & {
    enumName: string;
    enumSchema?: EnumSchemaAttributes;
});
interface ApiParamSchemaHost extends ParameterOptions {
    schema: SchemaObject;
}
export type ApiParamOptions = ApiParamMetadata | ApiParamSchemaHost;
export declare function ApiParam(options: ApiParamOptions): MethodDecorator & ClassDecorator;
export {};

import { Type } from '@nestjs/common';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import { ParameterObject, ReferenceObject, SchemaObject } from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
type ParameterOptions = Omit<ParameterObject, 'in' | 'schema' | 'name'>;
interface ApiQueryCommonMetadata extends ParameterOptions {
    type?: Type<unknown> | Function | [Function] | string;
    isArray?: boolean;
    enum?: SwaggerEnumType;
}
export type ApiQueryMetadata = ApiQueryCommonMetadata | ({
    name: string;
} & ApiQueryCommonMetadata & Omit<SchemaObject, 'required'>) | ({
    name?: string;
    enumName: string;
    enumSchema?: EnumSchemaAttributes;
} & ApiQueryCommonMetadata);
interface ApiQuerySchemaHost extends ParameterOptions {
    name?: string;
    schema: SchemaObject | ReferenceObject;
}
export type ApiQueryOptions = ApiQueryMetadata | ApiQuerySchemaHost;
export declare function ApiQuery(options: ApiQueryOptions): MethodDecorator & ClassDecorator;
export {};

import { Type } from '@nestjs/common';
import { ExamplesObject, ReferenceObject, RequestBodyObject, SchemaObject } from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
type RequestBodyOptions = Omit<RequestBodyObject, 'content'>;
interface ApiBodyMetadata extends RequestBodyOptions {
    type?: Type<unknown> | Function | [Function] | string;
    isArray?: boolean;
    enum?: SwaggerEnumType;
}
interface ApiBodySchemaHost extends RequestBodyOptions {
    schema: SchemaObject | ReferenceObject;
    examples?: ExamplesObject;
}
export type ApiBodyOptions = ApiBodyMetadata | ApiBodySchemaHost;
export declare function ApiBody(options: ApiBodyOptions): MethodDecorator;
export {};

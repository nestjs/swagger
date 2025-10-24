import { Type } from '@nestjs/common';
import { EnumSchemaAttributes } from './enum-schema-attributes.interface';
import { ReferenceObject, SchemaObject } from './open-api-spec.interface';
export type EnumAllowedTypes = any[] | Record<string, any> | (() => any[] | Record<string, any>);
interface SchemaObjectCommonMetadata extends Omit<SchemaObject, 'type' | 'required' | 'properties' | 'enum'> {
    isArray?: boolean;
    name?: string;
    enum?: EnumAllowedTypes;
}
export type SchemaObjectMetadata = (SchemaObjectCommonMetadata & {
    type?: Type<unknown> | Function | [Function] | 'array' | 'string' | 'number' | 'boolean' | 'integer' | 'null';
    required?: boolean;
}) | ({
    type?: Type<unknown> | Function | [Function] | Record<string, any>;
    required?: boolean;
    enumName: string;
    enumSchema?: EnumSchemaAttributes;
} & SchemaObjectCommonMetadata) | ({
    type: 'object';
    properties: Record<string, SchemaObjectMetadata>;
    required?: string[];
    selfRequired?: boolean;
} & SchemaObjectCommonMetadata) | ({
    type: 'object';
    properties?: Record<string, SchemaObjectMetadata>;
    additionalProperties: SchemaObject | ReferenceObject | boolean;
    required?: string[];
    selfRequired?: boolean;
} & SchemaObjectCommonMetadata);
export {};

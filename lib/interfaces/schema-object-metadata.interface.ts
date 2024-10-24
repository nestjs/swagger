import { Type } from '@nestjs/common';
import { EnumSchemaAttributes } from './enum-schema-attributes.interface';
import { SchemaObject } from './open-api-spec.interface';

interface SchemaObjectCommonMetadata
  extends Omit<SchemaObject, 'type' | 'required'> {
  type?: Type<unknown> | Function | [Function] | string | Record<string, any>;
  isArray?: boolean;
  required?: boolean;
  name?: string;
}

export type SchemaObjectMetadata =
  | SchemaObjectCommonMetadata
  | ({
      enumName: string;
      enumSchema?: EnumSchemaAttributes;
    } & SchemaObjectCommonMetadata);

import { Type } from '@nestjs/common';
import { SchemaObject } from './open-api-spec.interface';

export interface SchemaObjectMetadata
  extends Omit<SchemaObject, 'type' | 'required'> {
  type?: Type<unknown> | Function | [Function] | string | Record<string, any>;
  isArray?: boolean;
  required?: boolean;
  name?: string;
  enumName?: string;
}

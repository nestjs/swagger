import { Type } from '@nestjs/common';
import { SchemaObject } from './open-api-spec.interface';

export interface SchemaObjectMetadata
  extends Omit<SchemaObject, 'type' | 'required'> {
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  required?: boolean;
  name?: string;
}

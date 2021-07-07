import { DECORATORS } from '../constants';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { createClassDecorator, createPropertyDecorator } from './helpers';

export interface ApiSchemaOptions extends Pick<SchemaObjectMetadata, 'name'> {
  /**
   * Name of the schema.
   */
  name: string;
}

export function ApiSchema(options: ApiSchemaOptions): ClassDecorator {
  return createApiSchemaDecorator(options);
}

export function createApiSchemaDecorator(
  options: ApiSchemaOptions
): ClassDecorator {
  return createClassDecorator(DECORATORS.API_SCHEMA, [options]);
}

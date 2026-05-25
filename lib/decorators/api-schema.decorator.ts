import { DECORATORS } from '../constants.js';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface.js';
import { createClassDecorator } from './helpers.js';

export interface ApiSchemaOptions extends Pick<SchemaObjectMetadata, 'name'> {
  /**
   * Name of the schema.
   */
  name?: string;

  /**
   * Description of the schema.
   */
  description?: string;
}

/**
 * @publicApi
 */
export function ApiSchema(options?: ApiSchemaOptions): ClassDecorator {
  return createClassDecorator(DECORATORS.API_SCHEMA, [options]);
}

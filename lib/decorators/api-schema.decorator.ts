import { DECORATORS } from '../constants.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { createClassDecorator } from './helpers.js';

export interface ApiSchemaOptions extends SchemaObject {
  /**
   * Name of the schema.
   */
  name?: string;
}

/**
 * @publicApi
 */
export function ApiSchema(options?: ApiSchemaOptions): ClassDecorator {
  return createClassDecorator(DECORATORS.API_SCHEMA, [options]);
}

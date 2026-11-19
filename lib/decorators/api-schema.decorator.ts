import { DECORATORS } from '../constants.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { createClassDecorator } from './helpers.js';

export interface ApiSchemaOptions extends Pick<
  SchemaObject,
  | 'title'
  | 'additionalProperties'
  | 'patternProperties'
  | 'minProperties'
  | 'maxProperties'
  | 'deprecated'
  | 'example'
  | 'examples'
  | 'externalDocs'
  | 'xml'
  | 'discriminator'
  | 'readOnly'
  | 'writeOnly'
  | 'nullable'
> {
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

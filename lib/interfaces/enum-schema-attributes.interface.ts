import { SchemaObject } from './open-api-spec.interface.js';

export type EnumSchemaAttributes = Pick<
  SchemaObject,
  | 'default'
  | 'description'
  | 'deprecated'
  | 'readOnly'
  | 'writeOnly'
  | 'nullable'
>;

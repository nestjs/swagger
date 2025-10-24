import { SchemaObject } from './open-api-spec.interface';
export type EnumSchemaAttributes = Pick<SchemaObject, 'default' | 'description' | 'deprecated' | 'readOnly' | 'writeOnly' | 'nullable'>;

import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
export interface ApiSchemaOptions extends Pick<SchemaObjectMetadata, 'name'> {
    name?: string;
    description?: string;
}
export declare function ApiSchema(options?: ApiSchemaOptions): ClassDecorator;

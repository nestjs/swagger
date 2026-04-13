import { Type } from '@nestjs/common';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../services/model-properties-accessor';
import { SchemaObjectFactory } from '../services/schema-object-factory';
import { SwaggerTypesMapper } from '../services/swagger-types-mapper';

/**
 * Generates an OpenAPI SchemaObject for the given class based on its
 * `@ApiProperty` / `@ApiPropertyOptional` decorator metadata.
 *
 * The returned object contains the schema for the target class itself, and
 * `schemas` is populated with any nested schemas discovered while traversing
 * the model tree.
 *
 * @example
 * ```typescript
 * const { schema, schemas } = generateSchema(CreateUserDto);
 *
 * // Use inline in another @ApiProperty decorator:
 * @ApiProperty({ oneOf: [generateSchema(AnotherDto).schema, { type: 'boolean', enum: [false] }] })
 * value?: AnotherDto | false;
 * ```
 */
export function generateSchema<T = any>(
  target: Type<T>,
  extraSchemas: Record<string, SchemaObject> = {}
): { schema: SchemaObject; schemas: Record<string, SchemaObject> } {
  const factory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );

  const schemas: Record<string, SchemaObject> = { ...extraSchemas };
  factory.exploreModelSchema(target, schemas);

  return { schema: schemas[target.name], schemas };
}

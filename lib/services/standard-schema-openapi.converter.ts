import type { StandardJSONSchemaV1 } from '@standard-schema/spec';
import { omit } from 'es-toolkit/compat';
import type {
  StandardSchemaConversionResult,
  StandardSchemaConverter,
  StandardSchemaObject
} from '../interfaces/swagger-document-options.interface.js';
import { ReferenceObject, SchemaObject } from '../interfaces/open-api-spec.interface.js';

/**
 * JSON Schema keywords whose value is a map of names to schemas. The map itself
 * is not a schema, so its keys must not be treated as schema keywords.
 */
const SCHEMA_MAP_KEYWORDS = new Set([
  'properties',
  'patternProperties',
  'dependentSchemas',
  '$defs',
  'definitions'
]);

export interface ConvertedStandardSchema {
  schema: SchemaObject | ReferenceObject;
  components: Record<string, SchemaObject>;
}

export class StandardSchemaOpenApiConverter {
  constructor(private readonly schemaConverter?: StandardSchemaConverter) {}

  /**
   * Converts the given standard schema and merges any resulting definitions
   * into the document's shared component map.
   */
  convertInto(
    schema: unknown,
    schemas: Record<string, SchemaObject>,
    schemaType: 'input' | 'output' = 'input'
  ): SchemaObject | ReferenceObject | undefined {
    const convertedSchema = this.convert(schema, schemaType);
    if (!convertedSchema) {
      return undefined;
    }

    Object.assign(schemas, convertedSchema.components);
    return convertedSchema.schema;
  }

  convert(
    schema: unknown,
    schemaType: 'input' | 'output' = 'input'
  ): ConvertedStandardSchema | undefined {
    if (!this.isStandardSchema(schema)) {
      return undefined;
    }

    return this.convertSchema(schema, schemaType);
  }

  private convertSchema(
    schema: StandardSchemaObject,
    schemaType: 'input' | 'output'
  ): ConvertedStandardSchema | undefined {
    const customSchema = this.schemaConverter?.(schema, { schemaType });
    if (customSchema) {
      return this.normalizeCustomConvertedSchema(customSchema);
    }

    if (!this.hasStandardJsonSchema(schema)) {
      return undefined;
    }

    const convert = schema['~standard'].jsonSchema?.[schemaType];
    if (!convert) {
      return undefined;
    }

    const convertedSchema = convert({ target: 'openapi-3.0' });
    if (!convertedSchema || typeof convertedSchema !== 'object') {
      return undefined;
    }

    return this.normalizeConvertedSchema(
      convertedSchema as Record<string, unknown>
    );
  }

  private isStandardSchema(schema: unknown): schema is StandardSchemaObject {
    return !!(schema && typeof schema === 'object' && '~standard' in schema);
  }

  private hasStandardJsonSchema(
    schema: StandardSchemaObject
  ): schema is StandardJSONSchemaV1 {
    const standard = schema['~standard'];
    return !!standard && 'jsonSchema' in standard;
  }

  private normalizeCustomConvertedSchema(
    convertedSchema: StandardSchemaConversionResult
  ): ConvertedStandardSchema {
    return {
      // `rewriteValue` is used here (rather than `rewriteDefinitionRefs`) so a
      // schema that is itself a `$ref` gets its reference rewritten too.
      schema: this.rewriteValue(convertedSchema.schema) as
        | SchemaObject
        | ReferenceObject,
      components: this.rewriteComponents(convertedSchema.components || {})
    };
  }

  private normalizeConvertedSchema(
    schema: Record<string, unknown>
  ): ConvertedStandardSchema {
    return {
      schema: this.rewriteValue(
        omit(schema, ['$defs', 'definitions', '$schema'])
      ) as SchemaObject | ReferenceObject,
      components: this.rewriteComponents(
        Object.fromEntries(this.getDefinitionEntries(schema)) as Record<
          string,
          SchemaObject
        >
      )
    };
  }

  private rewriteComponents(
    components: Record<string, SchemaObject>
  ): Record<string, SchemaObject> {
    const rewrittenComponents: Record<string, SchemaObject> = {};
    for (const [name, definition] of Object.entries(components)) {
      rewrittenComponents[name] = this.rewriteDefinitionRefs(
        definition as Record<string, unknown>
      ) as SchemaObject;
    }
    return rewrittenComponents;
  }

  private getDefinitionEntries(schema: Record<string, unknown>) {
    const definitions = schema.$defs || schema.definitions;
    if (!definitions || typeof definitions !== 'object') {
      return [];
    }
    return Object.entries(definitions as Record<string, unknown>);
  }

  private rewriteDefinitionRefs(
    value: Record<string, unknown> | unknown[],
    isSchema = true
  ) {
    if (Array.isArray(value)) {
      return value.map((item) => this.rewriteValue(item));
    }

    const rewrittenValue: Record<string, unknown> = {};
    for (const [key, currentValue] of Object.entries(value)) {
      const rewrittenChild =
        isSchema && SCHEMA_MAP_KEYWORDS.has(key)
          ? this.rewriteSchemaMap(currentValue)
          : this.rewriteValue(currentValue);

      if (rewrittenChild !== undefined) {
        rewrittenValue[key] = rewrittenChild;
      }
    }

    // Keyword maps (e.g. `properties`) are not schemas themselves, so their
    // keys must never be interpreted as schema keywords.
    return isSchema
      ? this.normalizeSchemaExamples(rewrittenValue)
      : rewrittenValue;
  }

  private rewriteSchemaMap(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return this.rewriteValue(value);
    }

    return this.rewriteDefinitionRefs(value as Record<string, unknown>, false);
  }

  private rewriteValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.rewriteValue(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    const currentValue = value as Record<string, unknown>;
    if (typeof currentValue.$ref === 'string') {
      return {
        ...this.rewriteDefinitionRefs(omit(currentValue, ['$ref'])),
        $ref: currentValue.$ref
          .replace('#/$defs/', '#/components/schemas/')
          .replace('#/definitions/', '#/components/schemas/')
      };
    }

    return this.rewriteDefinitionRefs(currentValue);
  }

  private normalizeSchemaExamples(value: Record<string, unknown>) {
    const normalizedConstValue = this.normalizeSchemaConst(value);

    if (
      !Array.isArray(normalizedConstValue.examples) ||
      normalizedConstValue.example !== undefined
    ) {
      return normalizedConstValue;
    }

    const [firstExample] = normalizedConstValue.examples;
    return {
      ...omit(normalizedConstValue, ['examples']),
      example: firstExample
    };
  }

  private normalizeSchemaConst(value: Record<string, unknown>) {
    if (!('const' in value)) {
      return value;
    }

    // OpenAPI 3.0 has no `const` keyword. A sibling `enum` is always widened
    // compared to `const`, so the single constant value wins.
    return {
      ...omit(value, ['const']),
      enum: [value.const]
    };
  }
}

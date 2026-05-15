import type { StandardJSONSchemaV1 } from '@standard-schema/spec';
import { omit, omitBy, transform } from 'es-toolkit/compat';
import type {
  StandardSchemaConversionResult,
  StandardSchemaConverter,
  StandardSchemaObject
} from '../interfaces/swagger-document-options.interface.js';
import { ReferenceObject, SchemaObject } from '../interfaces/open-api-spec.interface.js';

export interface ConvertedStandardSchema {
  schema: SchemaObject | ReferenceObject;
  components: Record<string, SchemaObject>;
}

export class StandardSchemaOpenApiConverter {
  constructor(private readonly schemaConverter?: StandardSchemaConverter) {}

  convert(
    schema: unknown,
    schemaType: 'input' | 'output' = 'input'
  ): ConvertedStandardSchema | undefined {
    if (!this.isStandardSchema(schema)) {
      return undefined;
    }

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
      schema: this.rewriteDefinitionRefs(
        convertedSchema.schema as Record<string, unknown>
      ) as SchemaObject | ReferenceObject,
      components: this.rewriteComponents(convertedSchema.components || {})
    };
  }

  private normalizeConvertedSchema(
    schema: Record<string, unknown>,
    components: Record<string, SchemaObject> = {}
  ): ConvertedStandardSchema {
    const normalizedComponents = this.getDefinitionEntries(schema).reduce<
      Record<string, SchemaObject>
    >(
      (acc, [name, definition]) => ({
        ...acc,
        [name]: this.rewriteDefinitionRefs(
          definition as Record<string, unknown>
        ) as SchemaObject
      }),
      {}
    );

    return {
      schema: this.rewriteDefinitionRefs(
        omit(schema, ['$defs', 'definitions', '$schema'])
      ) as SchemaObject | ReferenceObject,
      components: {
        ...this.rewriteComponents(components),
        ...normalizedComponents
      }
    };
  }

  private rewriteComponents(
    components: Record<string, SchemaObject>
  ): Record<string, SchemaObject> {
    return Object.entries(components).reduce<Record<string, SchemaObject>>(
      (acc, [name, definition]) => ({
        ...acc,
        [name]: this.rewriteDefinitionRefs(
          definition as Record<string, unknown>
        ) as SchemaObject
      }),
      {}
    );
  }

  private getDefinitionEntries(schema: Record<string, unknown>) {
    const definitions = schema.$defs || schema.definitions;
    if (!definitions || typeof definitions !== 'object') {
      return [];
    }
    return Object.entries(definitions as Record<string, unknown>);
  }

  private rewriteDefinitionRefs(value: Record<string, unknown> | unknown[]) {
    if (Array.isArray(value)) {
      return value.map((item) => this.rewriteValue(item));
    }

    const rewrittenValue = omitBy(
      transform(
        value,
        (result, currentValue, key) => {
          result[key] = this.rewriteValue(currentValue);
        },
        {} as Record<string, unknown>
      ),
      (currentValue) => currentValue === undefined
    );

    return this.normalizeSchemaExamples(rewrittenValue);
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

    const constValue = value.const;
    if (!Array.isArray(value.examples) || value.example !== undefined) {
      return {
        ...omit(value, ['const']),
        enum: value.enum ?? [constValue]
      };
    }

    return {
      ...omit(value, ['const']),
      enum: value.enum ?? [constValue]
    };
  }
}
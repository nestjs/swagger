import { isString } from 'lodash';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';

export function getEnumValues(enumType: SwaggerEnumType | (() => SwaggerEnumType)): string[] | number[] {
  if (typeof enumType === 'function') {
    return getEnumValues(enumType());
  }

  if (Array.isArray(enumType)) {
    return enumType as string[];
  }
  if (typeof enumType !== 'object') {
    return [];
  }
  /*
    Enums with numeric values
      enum Size {
        SMALL = 1,
        BIG = 2
      }
    are transpiled to include a reverse mapping
      const Size = {
        "1": "SMALL",
        "2": "BIG",
        "SMALL": 1,
        "BIG": 2,
      }
   */
  const numericValues = Object.values(enumType)
    .filter((value) => typeof value === 'number')
    .map((value) => value.toString());

  return Object.keys(enumType)
    .filter((key) => !numericValues.includes(key))
    .map((key) => enumType[key]);
}

export function getEnumType(values: (string | number)[]): 'string' | 'number' {
  const hasString = values.filter(isString).length > 0;
  return hasString ? 'string' : 'number';
}

export function addEnumArraySchema(
  paramDefinition: Partial<Record<'schema' | 'isArray' | 'enumName', any>>,
  decoratorOptions: Partial<Record<'enum' | 'enumName', any>>
) {
  const paramSchema: SchemaObject = paramDefinition.schema || {};
  paramDefinition.schema = paramSchema;
  paramSchema.type = 'array';
  delete paramDefinition.isArray;

  const enumValues = getEnumValues(decoratorOptions.enum);
  paramSchema.items = {
    type: getEnumType(enumValues),
    enum: enumValues
  };

  if (decoratorOptions.enumName) {
    paramDefinition.enumName = decoratorOptions.enumName;
  }
}

export function addEnumSchema(
  paramDefinition: Partial<Record<string, any>>,
  decoratorOptions: Partial<Record<string, any>>
) {
  const paramSchema: SchemaObject = paramDefinition.schema || {};
  const enumValues = getEnumValues(decoratorOptions.enum);

  paramDefinition.schema = paramSchema;
  paramSchema.enum = enumValues;
  paramSchema.type = getEnumType(enumValues);

  if (decoratorOptions.enumName) {
    paramDefinition.enumName = decoratorOptions.enumName;
  }
}

export const isEnumArray = <T extends Partial<Record<'isArray' | 'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.isArray && obj.enum;

export const isEnumDefined = <T extends Partial<Record<'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.enum;

export const isEnumMetadata = (metadata: SchemaObjectMetadata) =>
  metadata.enum || (metadata.isArray && metadata.items?.['enum']);

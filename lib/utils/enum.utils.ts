import { isString } from 'lodash';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';

export function getEnumValues(
  enumType: SwaggerEnumType
): { values: string[] | number[]; enumName: string } {
  if (Array.isArray(enumType)) {
    return {
      values: enumType as string[],
      enumName: ''
    };
  }
  if (typeof enumType === 'object') {
    return {
      values: _getEnumFromDefinition(enumType),
      enumName: ''
    };
  }

  if (typeof enumType === 'function') {
    return {
      values: _getEnumFromDefinition(enumType()),
      enumName: _getEnumNameFromTypeFn(enumType.toString())
    };
  }

  return { values: [], enumName: '' };
}

function _getEnumNameFromTypeFn(fnString: string): string {
  return fnString
    .replace(/(?:\s|return|{|}|\(|\)|\$|_|,|;|\d)+/gm, '')
    .replace(/^[^A-Z]+/, '')
    .split('=>')
    .pop()
    .split('.')
    .pop();
}

function _getEnumFromDefinition(
  enumType: Record<number, string>
): string[] | number[] {
  const values = [];
  const uniqueValues = {};

  for (const key in enumType) {
    const value = enumType[key];
    // filter out cases where enum key also becomes its value (A: B, B: A)
    if (
      !uniqueValues.hasOwnProperty(value) &&
      !uniqueValues.hasOwnProperty(key)
    ) {
      values.push(value);
      uniqueValues[value] = value;
    }
  }
  return values;
}

export function getEnumType(values: (string | number)[]): 'string' | 'number' {
  const hasString = values.filter(isString).length > 0;
  return hasString ? 'string' : 'number';
}

export function addEnumArraySchema(
  paramDefinition: Record<'schema' | 'isArray' | 'enumName', any>,
  decoratorOptions: Partial<Record<'enum', any>>
) {
  const paramSchema: SchemaObject = paramDefinition.schema || {};
  paramDefinition.schema = paramSchema;
  paramSchema.type = 'array';
  delete paramDefinition.isArray;

  const enumValues = getEnumValues(decoratorOptions.enum);
  paramSchema.items = {
    type: getEnumType(enumValues.values),
    enum: enumValues.values
  };
  paramDefinition.enumName = enumValues.enumName;
}

export function addEnumSchema(
  paramDefinition: Record<'schema' | 'enumName', any>,
  decoratorOptions: Partial<Record<'enum', any>>
) {
  const paramSchema: SchemaObject = paramDefinition.schema || {};
  const enumValues = getEnumValues(decoratorOptions.enum);

  paramDefinition.schema = paramSchema;
  paramSchema.enum = enumValues.values;
  paramSchema.type = getEnumType(enumValues.values);
  paramDefinition.enumName = enumValues.enumName;
}

export const isEnumArray = <T extends Partial<Record<'isArray' | 'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.isArray && obj.enum;

export const isEnumDefined = <T extends Partial<Record<'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.enum;

export const isEnumMetadata = (metadata: SchemaObjectMetadata) =>
  metadata.enum || (metadata.isArray && metadata.items['enum']);

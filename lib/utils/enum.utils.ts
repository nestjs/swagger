import { isString } from 'lodash';
import {
  BaseParameterObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface';
import { ParamWithTypeMetadata } from '../services/parameter-metadata-accessor';
import { SwaggerEnumType } from '../types/swagger-enum.type';

export function getEnumValues(enumType: SwaggerEnumType): string[] | number[] {
  if (Array.isArray(enumType)) {
    return enumType as string[];
  }

  if (typeof enumType !== 'object') {
    return [];
  }

  const values = [];
  const uniqueValues = {};

  for (const key in enumType) {
    const value = enumType[key];
    // filter out cases where enum key also becomes its value (A: B, B: A)	    // filter out cases where enum key also
    // becomes its value (A: B, B: A)
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
  paramDefinition: Record<'schema' | 'enumName', any>,
  decoratorOptions: Partial<Record<'enum' | 'enumName', any>>
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

export const cleanUpParam = (
  param: ParamWithTypeMetadata & BaseParameterObject
) => {
  if (param.isArray) {
    delete param.isArray;
    delete param['items'];
  }

  delete param.enumName;
  delete param.enum;
};

export const isEnumArray = <T extends Partial<Record<'isArray' | 'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.isArray && obj.enum;

export const isEnumDefined = <T extends Partial<Record<'enum', any>>>(
  obj: Record<string, any>
): obj is T => obj.enum;

export const isEnumMetadata = (metadata: SchemaObjectMetadata) =>
  metadata.enum || (metadata.isArray && metadata.items?.['enum']);

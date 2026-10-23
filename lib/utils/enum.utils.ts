import { isString } from 'es-toolkit/compat';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { SchemaObjectMetadata } from '../interfaces/schema-object-metadata.interface.js';
import { SwaggerEnumType } from '../types/swagger-enum.type.js';

export function getEnumValues(
  enumType: SwaggerEnumType | (() => SwaggerEnumType)
): string[] | number[] | boolean[] {
  if (typeof enumType === 'function') {
    return getEnumValues(enumType());
  }

  if (Array.isArray(enumType)) {
    return enumType as string[];
  }
  if (typeof enumType !== 'object') {
    return [];
  }
  // Enums with numeric values
  //   enum Size {
  //     SMALL = 1,
  //     BIG = 2
  //   }
  // are transpiled to include a reverse mapping
  //   const Size = {
  //     "1": "SMALL",
  //     "2": "BIG",
  //     "SMALL": 1,
  //     "BIG": 2,
  //   }
  const numericValues = Object.values(enumType)
    .filter((value) => typeof value === 'number')
    .map((value: any) => value.toString());

  return Object.keys(enumType)
    .filter((key) => !numericValues.includes(key))
    .map((key) => enumType[key]);
}

/**
 * Every wrapper created by `createLazyEnum`.
 */
const lazyEnums = new WeakSet<object>();

/**
 * Lazy enums whose `type` was not given by the user, so it has to be inferred from the
 * resolved values once the function is called. Keyed on the wrapper created by
 * `createLazyEnum`, which is unique per decorated property.
 */
const lazyEnumsWithInferredType = new WeakSet<object>();

/**
 * Wraps an enum function so that it is only called when the document is generated.
 * `inferType` records that the type must then be inferred from the resolved values.
 *
 * A function that is already a wrapper is returned as is, to keep what was recorded
 * for it: the mapped types (`PartialType`, `PickType`...) apply `ApiProperty` again
 * with the stored metadata, where `type` is set by then.
 */
export function createLazyEnum(
  enumFn: () => any[] | Record<string, any>,
  inferType: boolean
): () => any[] | Record<string, any> {
  if (lazyEnums.has(enumFn)) {
    return enumFn;
  }
  const lazyEnum = () => enumFn();
  lazyEnums.add(lazyEnum);
  if (inferType) {
    lazyEnumsWithInferredType.add(lazyEnum);
  }
  return lazyEnum;
}

export function isLazyEnumTypeInferred(lazyEnum: object): boolean {
  return lazyEnumsWithInferredType.has(lazyEnum);
}

export function getEnumType(
  values: (string | number | boolean)[]
): 'string' | 'number' | 'boolean' {
  const hasString = values.filter(isString).length > 0;
  if (hasString) {
    return 'string';
  }
  const hasBoolean = values.filter((v) => typeof v === 'boolean').length > 0;
  return hasBoolean ? 'boolean' : 'number';
}

export function addEnumArraySchema(
  paramDefinition: Partial<
    Record<'schema' | 'isArray' | 'enumName' | 'enumSchema', any>
  >,
  decoratorOptions: Partial<Record<'enum' | 'enumName' | 'enumSchema', any>>
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

  if (decoratorOptions.enumSchema) {
    paramDefinition.enumSchema = decoratorOptions.enumSchema;
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

  if (decoratorOptions.enumSchema) {
    paramDefinition.enumSchema = decoratorOptions.enumSchema;
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

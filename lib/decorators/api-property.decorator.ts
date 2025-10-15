import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import {
  EnumAllowedTypes,
  SchemaObjectMetadata
} from '../interfaces/schema-object-metadata.interface';
import { getEnumType, getEnumValues } from '../utils/enum.utils';
import { createPropertyDecorator, getTypeIsArrayTuple } from './helpers';

export type ApiPropertyCommonOptions = SchemaObjectMetadata & {
  'x-enumNames'?: string[];
  /**
   * Lazy function returning the type for which the decorated property
   * can be used as an id
   *
   * Use together with @ApiDefaultGetter on the getter route of the type
   * to generate OpenAPI link objects
   *
   * @see [Swagger link objects](https://swagger.io/docs/specification/links/)
   */
  link?: () => Type<unknown> | Function;
};

export type ApiPropertyOptions =
  | ApiPropertyCommonOptions
  | (ApiPropertyCommonOptions & {
      enumName: string;
      enumSchema?: EnumSchemaAttributes;
    });

const isEnumArray = (
  opts: ApiPropertyOptions
): opts is {
  isArray: true;
  enum: EnumAllowedTypes;
  type: any;
  items: any;
} => opts.isArray && 'enum' in opts && opts.enum !== undefined;

/**
 * @publicApi
 */
export function ApiProperty(
  options: ApiPropertyOptions = {}
): PropertyDecorator {
  return createApiPropertyDecorator(options);
}

export function createApiPropertyDecorator(
  options: ApiPropertyOptions = {},
  overrideExisting = true
): PropertyDecorator {
  const [type, isArray] = getTypeIsArrayTuple(options.type, options.isArray);
  options = {
    ...options,
    type,
    isArray
  } as ApiPropertyOptions;

  if (isEnumArray(options)) {
    options.type = 'array';

    const enumValues = getEnumValues(options.enum);
    options.items = {
      type: getEnumType(enumValues),
      enum: enumValues
    };
    delete options.enum;
  } else if ('enum' in options && options.enum !== undefined) {
    const enumValues = getEnumValues(options.enum);

    options.enum = enumValues;
    options.type = getEnumType(enumValues);
  }

  if (Array.isArray(options.type)) {
    options.type = 'array';
    options.items = {
      type: 'array',
      items: {
        type: options.type[0]
      }
    };
  }

  return createPropertyDecorator(
    DECORATORS.API_MODEL_PROPERTIES,
    options,
    overrideExisting
  );
}

export function ApiPropertyOptional(
  options: ApiPropertyOptions = {}
): PropertyDecorator {
  return ApiProperty({
    ...options,
    required: false
  } as ApiPropertyOptions);
}

export function ApiResponseProperty(
  options: Pick<
    ApiPropertyOptions,
    'type' | 'example' | 'format' | 'deprecated' | 'enum'
  > = {}
): PropertyDecorator {
  return ApiProperty({
    readOnly: true,
    ...options
  } as ApiPropertyOptions);
}

import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
import {
  EnumAllowedTypes,
  SchemaObjectMetadata
} from '../interfaces/schema-object-metadata.interface';
import { getEnumType, getEnumValues } from '../utils/enum.utils';
import { createPropertyDecorator, getTypeIsArrayTuple } from './helpers';
import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';

type ApiPropertyCommonOptions = (Omit<SchemaObjectMetadata, 'pattern'> & {
  pattern?: string | RegExp;
  properties?: Record<string, SchemaObject | ReferenceObject>;
  selfRequired?: boolean;
}) & {
  'x-enumNames'?: string[];
  selfRequired?: boolean;
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

function normalizePattern(p?: string | RegExp): string | undefined {
  return p instanceof RegExp ? p.source : p;
}

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
  const normalized: ApiPropertyOptions = {
    ...(options as any),
    ...(Object.prototype.hasOwnProperty.call(options, 'pattern')
      ? { pattern: normalizePattern((options as any).pattern) }
      : null)
  };

  const [type, isArray] = getTypeIsArrayTuple(
    (normalized as any).type,
    (normalized as any).isArray
  );

  let finalOptions = {
    ...(normalized as any),
    type,
    isArray
  } as ApiPropertyOptions;

  if (isEnumArray(finalOptions as any)) {
    const enumValues = getEnumValues((finalOptions as any).enum);
    finalOptions = {
      ...(finalOptions as any),
      type: 'array',
      items: {
        type: getEnumType(enumValues),
        enum: enumValues
      }
    } as any;
    delete (finalOptions as any).enum;
  } else if (
    'enum' in (finalOptions as any) &&
    (finalOptions as any).enum !== undefined
  ) {
    const enumValues = getEnumValues((finalOptions as any).enum);
    (finalOptions as any).enum = enumValues;
    (finalOptions as any).type = getEnumType(enumValues);
  }

  if (Array.isArray((finalOptions as any).type)) {
    (finalOptions as any).items = {
      type: 'array',
      items: { type: (finalOptions as any).type[0] }
    };
    (finalOptions as any).type = 'array';
  }

  return createPropertyDecorator(
    DECORATORS.API_MODEL_PROPERTIES,
    finalOptions,
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

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
    if (!options.type) {
      options.type = getEnumType(enumValues);
    }
  }

  if (Array.isArray(options.type)) {
    // `getTypeIsArrayTuple` strips one level of array wrapping, so when
    // `options.type` is still an array here the caller provided a nested
    // array type (e.g. `type: [[String]]` or `type: [String], isArray: true`).
    // Capture the inner type before reassignment - reading `options.type[0]`
    // after the assignment below would index into the string `'array'` and
    // produce `items.items.type === 'a'` (the first character of `'array'`).
    const innerType = options.type[0];
    options.type = 'array';
    options.items = {
      type: 'array',
      items: {
        // Normalize built-in constructors (String, Number, Boolean, ...) to
        // their OpenAPI primitive names; `JSON.stringify` would otherwise drop
        // a raw constructor entirely from the emitted document.
        type:
          typeof innerType === 'function'
            ? innerType.name.charAt(0).toLowerCase() + innerType.name.slice(1)
            : innerType
      }
    };
  }

  if (options.pattern instanceof RegExp) {
    options.pattern = options.pattern.source;
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

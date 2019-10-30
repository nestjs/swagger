import { Type } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import {
  ParameterObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { getEnumType, getEnumValues } from '../utils/enum.utils';
import { createParamDecorator } from './helpers';

type ParameterOptions = Omit<ParameterObject, 'in' | 'schema'>;

interface ApiQueryMetadata extends ParameterOptions {
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  enum?: SwaggerEnumType;
}

interface ApiQuerySchemaHost extends ParameterOptions {
  schema: SchemaObject;
}

export type ApiQueryOptions = ApiQueryMetadata | ApiQuerySchemaHost;

const defaultQueryOptions: ApiQueryOptions = {
  name: '',
  required: true
};

const isEnumArray = (obj: Record<string, any>): obj is ApiQueryMetadata =>
  obj.isArray && obj.enum;

export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  const param = {
    name: isNil(options.name) ? defaultQueryOptions.name : options.name,
    in: 'query',
    ...omit(options, 'enum')
  };

  if (isEnumArray(options)) {
    const paramSchema: SchemaObject =
      ((param as ApiQuerySchemaHost).schema as SchemaObject) || {};
    (param as ApiQuerySchemaHost).schema = paramSchema;
    paramSchema.type = 'array';

    delete (param as ApiQueryMetadata).isArray;

    const enumValues = getEnumValues(options.enum);
    paramSchema.items = {
      type: getEnumType(enumValues),
      enum: enumValues
    };
  } else if ((options as ApiQueryMetadata).enum) {
    const paramSchema: SchemaObject =
      ((param as ApiQuerySchemaHost).schema as SchemaObject) || {};
    const enumValues = getEnumValues((options as ApiQueryMetadata).enum);

    (param as ApiQuerySchemaHost).schema = paramSchema;
    paramSchema.enum = enumValues;
    paramSchema.type = getEnumType(enumValues);
  }
  return createParamDecorator(param, defaultQueryOptions);
}

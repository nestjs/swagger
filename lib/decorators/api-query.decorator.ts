import { Type } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import {
  ParameterObject,
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import {
  addEnumArraySchema,
  addEnumSchema,
  isEnumArray,
  isEnumDefined
} from '../utils/enum.utils';
import { createParamDecorator, getTypeIsArrayTuple } from './helpers';

type ParameterOptions = Omit<ParameterObject, 'in' | 'schema' | 'name'>;

interface ApiQueryMetadata extends ParameterOptions {
  name?: string;
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  enum?: SwaggerEnumType;
  enumName?: string;
}

interface ApiQuerySchemaHost extends ParameterOptions {
  name?: string;
  schema: SchemaObject | ReferenceObject;
}

export type ApiQueryOptions = ApiQueryMetadata | ApiQuerySchemaHost;

const defaultQueryOptions: ApiQueryOptions = {
  name: '',
  required: true
};

export function ApiQuery(
  options: ApiQueryOptions
): MethodDecorator & ClassDecorator {
  const apiQueryMetadata = options as ApiQueryMetadata;
  const [type, isArray] = getTypeIsArrayTuple(
    apiQueryMetadata.type,
    apiQueryMetadata.isArray
  );
  const param: ApiQueryMetadata & Record<string, any> = {
    name: isNil(options.name) ? defaultQueryOptions.name : options.name,
    in: 'query',
    ...omit(options, 'enum'),
    type
  };

  if (isEnumArray(options)) {
    addEnumArraySchema(param, options);
  } else if (isEnumDefined(options)) {
    addEnumSchema(param, options);
  }

  if (isArray) {
    param.isArray = isArray;
  }

  return createParamDecorator(param, defaultQueryOptions);
}

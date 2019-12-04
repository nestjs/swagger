import { Type } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import {
  ParameterObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import {
  addEnumArraySchema,
  addEnumSchema,
  isEnumArray,
  isEnumDefined
} from '../utils/enum.utils';
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

export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  const param: ApiQueryMetadata & Record<string, any> = {
    name: isNil(options.name) ? defaultQueryOptions.name : options.name,
    in: 'query',
    ...omit(options, 'enum')
  };

  if (isEnumArray(options)) {
    addEnumArraySchema(param, options);
  } else if (isEnumDefined(options)) {
    addEnumSchema(param, options);
  }

  !param['enumName'] && delete param['enumName'];

  return createParamDecorator(param, defaultQueryOptions);
}

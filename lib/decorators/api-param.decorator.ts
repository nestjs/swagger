import { Type } from '@nestjs/common';
import { isNil, omit } from 'lodash';
import {
  ParameterObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { addEnumSchema, isEnumDefined } from '../utils/enum.utils';
import { createParamDecorator } from './helpers';

type ParameterOptions = Omit<ParameterObject, 'in' | 'schema'>;

interface ApiParamMetadata extends ParameterOptions {
  type?: Type<unknown> | Function | [Function] | string;
  format?: string;
  enum?: SwaggerEnumType;
  enumName?: string;
}

interface ApiParamSchemaHost extends ParameterOptions {
  schema: SchemaObject;
}

export type ApiParamOptions = ApiParamMetadata | ApiParamSchemaHost;

const defaultParamOptions: ApiParamOptions = {
  name: '',
  required: true
};

export function ApiParam(
  options: ApiParamOptions
): MethodDecorator & ClassDecorator {
  const param: ApiParamMetadata & Record<string, any> = {
    name: isNil(options.name) ? defaultParamOptions.name : options.name,
    in: 'path',
    ...omit(options, 'enum')
  };

  if (isEnumDefined(options)) {
    addEnumSchema(param, options);
  }

  return createParamDecorator(param, defaultParamOptions);
}

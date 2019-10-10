import { Type } from '@nestjs/common';
import { isNil } from 'lodash';
import {
  ParameterLocation,
  ParameterObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { createMultipleParamDecorator, createParamDecorator } from './helpers';

export interface ApiHeaderOptions extends Omit<ParameterObject, 'in'> {
  type?: Type<unknown> | Function | [Function] | string;
  enum?: SwaggerEnumType;
}

const defaultHeaderOptions: Partial<ApiHeaderOptions> = {
  name: ''
};

export function ApiHeader(options: ApiHeaderOptions): any {
  const param: ApiHeaderOptions & { in: ParameterLocation } = {
    name: isNil(options.name) ? defaultHeaderOptions.name : options.name,
    in: 'header',
    description: options.description,
    required: options.required,
    type: options.type
  };
  return createParamDecorator(param, defaultHeaderOptions);
}

export const ApiHeaders = (headers: ApiHeaderOptions[]): MethodDecorator => {
  const multiMetadata: ApiHeaderOptions[] = headers.map(metadata => ({
    name: isNil(metadata.name) ? defaultHeaderOptions.name : metadata.name,
    in: 'header',
    description: metadata.description,
    required: metadata.required,
    type: String
  }));
  return createMultipleParamDecorator(multiMetadata, defaultHeaderOptions);
};

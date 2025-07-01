import { isNil, isUndefined, negate, pickBy } from 'es-toolkit/compat';
import { DECORATORS } from '../constants';
import {
  ParameterLocation,
  ParameterObject
} from '../interfaces/open-api-spec.interface';
import { SwaggerEnumType } from '../types/swagger-enum.type';
import { getEnumType, getEnumValues } from '../utils/enum.utils';
import { createClassDecorator, createParamDecorator } from './helpers';

export interface ApiHeaderOptions extends Omit<ParameterObject, 'in'> {
  enum?: SwaggerEnumType;
}

const defaultHeaderOptions: Partial<ApiHeaderOptions> = {
  name: ''
};

/**
 * @publicApi
 */
export function ApiHeader(
  options: ApiHeaderOptions
): MethodDecorator & ClassDecorator {
  const param = pickBy<ApiHeaderOptions & { in: ParameterLocation }>(
    {
      name: isNil(options.name) ? defaultHeaderOptions.name : options.name,
      in: 'header',
      description: options.description,
      required: options.required,
      examples: options.examples,
      schema: {
        type: 'string',
        ...(options.schema || {})
      }
    },
    negate(isUndefined)
  );

  if (options.enum) {
    const enumValues = getEnumValues(options.enum);
    param.schema = {
      ...param.schema,
      enum: enumValues,
      type: getEnumType(enumValues)
    };
  }

  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    if (descriptor) {
      return createParamDecorator(param, defaultHeaderOptions)(
        target,
        key,
        descriptor
      );
    }
    return createClassDecorator(DECORATORS.API_HEADERS, [param])(
      target as Function
    );
  };
}

export const ApiHeaders = (
  headers: ApiHeaderOptions[]
): MethodDecorator & ClassDecorator => {
  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    headers.forEach((options) => ApiHeader(options)(target, key, descriptor));
  };
};

import { Type } from '@nestjs/common';
import { omit } from 'lodash';
import { EnumSchemaAttributes } from '../interfaces/enum-schema-attributes.interface';
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

interface ApiQueryCommonMetadata extends ParameterOptions {
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  enum?: SwaggerEnumType;
}

export type ApiQueryMetadata =
  | ApiQueryCommonMetadata
  | ({ name: string } & ApiQueryCommonMetadata & Omit<SchemaObject, 'required'>)
  | ({
      name?: string;
      enumName: string;
      enumSchema?: EnumSchemaAttributes;
    } & ApiQueryCommonMetadata);

interface ApiQuerySchemaHost extends ParameterOptions {
  name?: string;
  schema: SchemaObject | ReferenceObject;
}

export type ApiQueryOptions = ApiQueryMetadata | ApiQuerySchemaHost;

const defaultQueryOptions = {
  name: '',
  required: true
};

/**
 * @publicApi
 */
export function ApiQuery(
  options: ApiQueryOptions
): MethodDecorator & ClassDecorator {
  const apiQueryMetadata = options as ApiQueryMetadata;
  const [type, isArray] = getTypeIsArrayTuple(
    apiQueryMetadata.type,
    apiQueryMetadata.isArray
  );

  const param: ApiQueryMetadata & Record<string, any> = {
    name: 'name' in options ? options.name : defaultQueryOptions.name,
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

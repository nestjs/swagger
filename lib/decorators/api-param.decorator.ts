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

interface ApiParamMetadata extends ParameterOptions {
  type?: Type<unknown> | Function | [Function] | string;
  enum?: SwaggerEnumType;
}

interface ApiParamSchemaHost extends ParameterOptions {
  schema: SchemaObject;
}

export type ApiParamOptions = ApiParamMetadata | ApiParamSchemaHost;

const defaultParamOptions: ApiParamOptions = {
  name: '',
  required: true
};

export function ApiParam(options: ApiParamOptions): MethodDecorator {
  const param: Record<string, any> = {
    name: isNil(options.name) ? defaultParamOptions.name : options.name,
    in: 'path',
    ...omit(options, 'enum')
  };

  if ((options as ApiParamMetadata).enum) {
    param.schema = param.schema || ({} as SchemaObject);

    const enumValues = getEnumValues((options as ApiParamMetadata).enum);
    (param.schema as SchemaObject).type = getEnumType(enumValues.values);
    (param.schema as SchemaObject).enum = enumValues.values;

    if (enumValues.enumName) {
      param['enumName'] = enumValues.enumName;
    }
  }

  !param['enumName'] && delete param['enumName'];
  return createParamDecorator(param, defaultParamOptions);
}

import { isNil } from 'lodash';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { createParamDecorator } from './helpers';

export interface ApiFileOptions {
  name: string;
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
}

const defaultFileOptions: ApiFileOptions = {
  name: ''
};

export function ApiFile(options: ApiFileOptions): MethodDecorator {
  const param = {
    name: isNil(options.name) ? defaultFileOptions.name : options.name,
    in: 'body',
    type: 'file',
    ...options
  };
  return createParamDecorator(param, defaultFileOptions);
}

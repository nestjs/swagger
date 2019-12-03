import { Type } from '@nestjs/common';
import {
  RequestBodyObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';
import { createParamDecorator, getTypeIsArrayTuple } from './helpers';

type RequestBodyOptions = Omit<RequestBodyObject, 'content'>;

interface ApiBodyMetadata extends RequestBodyOptions {
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
}

interface ApiBodySchemaHost extends RequestBodyOptions {
  schema: SchemaObject;
}

export type ApiBodyOptions = ApiBodyMetadata | ApiBodySchemaHost;

const defaultBodyMetadata: ApiBodyMetadata = {
  type: String,
  required: true
};

export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  const [type, isArray] = getTypeIsArrayTuple(
    (options as ApiBodyMetadata).type,
    (options as ApiBodyMetadata).isArray
  );
  const param: ApiBodyMetadata & { in: 'body' } = {
    in: 'body',
    ...options,
    type,
    isArray
  };
  return createParamDecorator(param, defaultBodyMetadata);
}

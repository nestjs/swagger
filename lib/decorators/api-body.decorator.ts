import lodash from 'lodash';
import { Type } from '@nestjs/common';
const { omit } = lodash;
import {
  EncodingObject,
  ExamplesObject,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { SwaggerEnumType } from '../types/swagger-enum.type.js';
import {
  addEnumArraySchema,
  addEnumSchema,
  isEnumArray,
  isEnumDefined
} from '../utils/enum.utils.js';
import { createParamDecorator, getTypeIsArrayTuple } from './helpers.js';

type RequestBodyOptions = Omit<RequestBodyObject, 'content'>;

interface ApiBodyMetadata extends RequestBodyOptions {
  type?: Type<unknown> | Function | [Function] | string;
  isArray?: boolean;
  enum?: SwaggerEnumType;
  encoding?: EncodingObject;
}

interface ApiBodySchemaHost extends RequestBodyOptions {
  schema: SchemaObject | ReferenceObject;
  examples?: ExamplesObject;
  encoding?: EncodingObject;
}

export type ApiBodyOptions = ApiBodyMetadata | ApiBodySchemaHost;

const defaultBodyMetadata: ApiBodyMetadata = {
  type: String,
  required: true
};

/**
 * @publicApi
 */
export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  const [type, isArray] = getTypeIsArrayTuple(
    (options as ApiBodyMetadata).type,
    (options as ApiBodyMetadata).isArray
  );
  const param: ApiBodyMetadata & Record<string, any> = {
    in: 'body',
    ...omit(options, 'enum'),
    type,
    isArray
  };

  if (isEnumArray(options)) {
    addEnumArraySchema(param, options);
  } else if (isEnumDefined(options)) {
    addEnumSchema(param, options);
  }
  return createParamDecorator(param, defaultBodyMetadata);
}

import { HttpStatus, RequestMethod, Type } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { get, mapValues, omit } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiResponseMetadata } from '../decorators';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { ResponseObjectFactory } from '../services/response-object-factory';
import { mergeAndUniq } from '../utils/merge-and-uniq.util';

const responseObjectFactory = new ResponseObjectFactory();

export const exploreGlobalApiResponseMetadata = (
  schemas: Record<string, SchemaObject>,
  metatype: Type<unknown>
) => {
  const responses: ApiResponseMetadata[] = Reflect.getMetadata(
    DECORATORS.API_RESPONSE,
    metatype
  );
  const produces = Reflect.getMetadata(DECORATORS.API_PRODUCES, metatype);
  return responses
    ? {
        responses: mapResponsesToSwaggerResponses(responses, schemas, produces)
      }
    : undefined;
};

export const exploreApiResponseMetadata = (
  schemas: Record<string, SchemaObject>,
  instance: object,
  prototype: Type<unknown>,
  method: Function
) => {
  const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, method);
  if (responses) {
    const classProduces = Reflect.getMetadata(
      DECORATORS.API_PRODUCES,
      prototype
    );
    const methodProduces = Reflect.getMetadata(DECORATORS.API_PRODUCES, method);
    const produces = mergeAndUniq<string[]>(
      get(classProduces, 'produces'),
      methodProduces
    );
    return mapResponsesToSwaggerResponses(responses, schemas, produces);
  }
  const status = getStatusCode(method);
  if (status) {
    return { [status]: { description: '' } };
  }
  return undefined;
};

const getStatusCode = (method: Function) => {
  const status = Reflect.getMetadata(HTTP_CODE_METADATA, method);
  if (status) {
    return status;
  }
  const requestMethod: RequestMethod = Reflect.getMetadata(
    METHOD_METADATA,
    method
  );
  switch (requestMethod) {
    case RequestMethod.POST:
      return HttpStatus.CREATED;
    default:
      return HttpStatus.OK;
  }
};

const omitParamType = (param: Record<string, any>) => omit(param, 'type');
const mapResponsesToSwaggerResponses = (
  responses: ApiResponseMetadata[],
  schemas: Record<string, SchemaObject>,
  produces: string[] = ['application/json']
) => {
  produces = isEmpty(produces) ? ['application/json'] : produces;

  const openApiResponses = mapValues(
    responses,
    (response: ApiResponseMetadata) =>
      responseObjectFactory.create(response, produces, schemas)
  );
  return mapValues(openApiResponses, omitParamType);
};

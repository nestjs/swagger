import { HttpStatus, RequestMethod, Type } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { get } from 'lodash';
import { DECORATORS } from '../constants';
import { ApiResponseMetadata } from '../decorators';
import { SchemaObject } from '../interfaces/open-api-spec.interface';
import { mapResponsesToSwaggerResponses } from '../utils/map-responses-to-swagger-responses.util';
import { mergeAndUniq } from '../utils/merge-and-uniq.util';

export const exploreGlobalApiResponseMetadata = (
  schemas: SchemaObject[],
  metatype: Type<unknown>
) => {
  const responses: Record<string, ApiResponseMetadata> = Reflect.getMetadata(
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
  schemas: SchemaObject[],
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

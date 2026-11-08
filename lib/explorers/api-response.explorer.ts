import { HttpStatus, RequestMethod, Type } from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA
} from '@nestjs/common/constants.js';
import { isEmpty } from '@nestjs/common/utils/shared.utils.js';
import mapValues from 'es-toolkit/compat/mapValues';
import omit from 'es-toolkit/compat/omit';
import { DECORATORS } from '../constants.js';
import { ApiResponse, ApiResponseMetadata } from '../decorators/index.js';
import { GlobalResponses } from '../interfaces/global-metadata.interface.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants.js';
import {
  FactoriesNeededByResponseFactory,
  ResponseObjectFactory
} from '../services/response-object-factory.js';
import { mergeAndUniq } from '../utils/merge-and-uniq.util.js';

export const exploreGlobalApiResponseMetadata = (
  schemas: Record<string, SchemaObject>,
  responseObjectFactory: ResponseObjectFactory,
  globalResponses: GlobalResponses,
  metatype: Type<unknown>,
  factories: FactoriesNeededByResponseFactory
) => {
  const responses: ApiResponseMetadata[] = Reflect.getMetadata(
    DECORATORS.API_RESPONSE,
    metatype
  );
  const mappedGlobalResponsesOrUndefined = globalResponses
    ? mapResponsesToSwaggerResponses(
        globalResponses,
        schemas,
        responseObjectFactory,
        undefined,
        factories
      )
    : undefined;

  const produces = Reflect.getMetadata(DECORATORS.API_PRODUCES, metatype);
  return responses
    ? {
        responses: {
          ...mappedGlobalResponsesOrUndefined,
          ...mapResponsesToSwaggerResponses(
            responses,
            schemas,
            responseObjectFactory,
            produces,
            factories
          )
        }
      }
    : mappedGlobalResponsesOrUndefined
      ? {
          responses: mappedGlobalResponsesOrUndefined
        }
      : undefined;
};

export const exploreApiResponseMetadata = (
  schemas: Record<string, SchemaObject>,
  responseObjectFactory: ResponseObjectFactory,
  factories: FactoriesNeededByResponseFactory,
  instance: object,
  prototype: Type<unknown>,
  method: Function,
  metatype?: Type<unknown>
) => {
  applyMetadataFactory(prototype, instance);

  const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, method);
  if (responses) {
    // `@ApiProduces` is a class-level decorator that stores metadata on the
    // class constructor (the metatype). Reading from `prototype` always
    // returned undefined, silently dropping class-level produces overrides.
    const classProduces = Reflect.getMetadata(
      DECORATORS.API_PRODUCES,
      metatype ?? prototype?.constructor
    );
    const methodProduces = Reflect.getMetadata(DECORATORS.API_PRODUCES, method);
    const produces = mergeAndUniq<string[]>(classProduces, methodProduces);
    return mapResponsesToSwaggerResponses(
      responses,
      schemas,
      responseObjectFactory,
      produces,
      factories
    );
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
  responses: ApiResponseMetadata[] | Record<string, ApiResponseMetadata>,
  schemas: Record<string, SchemaObject>,
  responseObjectFactory: ResponseObjectFactory,
  produces: string[] = ['application/json'],
  factories: FactoriesNeededByResponseFactory
) => {
  produces = isEmpty(produces) ? ['application/json'] : produces;

  const openApiResponses = mapValues(
    responses,
    (response: ApiResponseMetadata) =>
      responseObjectFactory.create(response, produces, schemas, factories)
  );
  return mapValues(openApiResponses, omitParamType);
};

// Error statuses (4xx/5xx) must not suppress the inferred success response.
const hasSuccessResponse = (responses?: Record<string, unknown>) =>
  Object.keys(responses ?? {}).some(
    (status) => isNaN(Number(status)) || Number(status) < 400
  );

function applyMetadataFactory(prototype: Type<unknown>, instance: object) {
  do {
    if (!prototype.constructor) {
      return;
    }
    // A factory inherited through the static chain is applied once the loop
    // reaches the class that declares it.
    if (
      !Object.prototype.hasOwnProperty.call(
        prototype.constructor,
        METADATA_FACTORY_NAME
      )
    ) {
      continue;
    }
    const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
    // The factory describes the methods its class declares, not the methods
    // of a subclass that override them.
    const methodKeys = Object.keys(metadata).filter(
      (key) =>
        typeof instance[key] === 'function' &&
        Object.prototype.hasOwnProperty.call(prototype, key)
    );
    methodKeys.forEach((key) => {
      const {
        summary,
        deprecated,
        tags,
        description,
        responses = [],
        ...meta
      } = metadata[key];

      if (Object.keys(meta).length === 0 && responses.length === 0) {
        return;
      }
      if (meta.status === undefined) {
        meta.status = getStatusCode(prototype[key]);
      }
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      const existing = Reflect.getMetadata(
        DECORATORS.API_RESPONSE,
        descriptor?.value ?? prototype
      );
      if (hasSuccessResponse(existing)) {
        return;
      }
      // overrideExisting: false would skip every response after the first one.
      [meta, ...responses]
        .filter((response) => !existing?.[response.status])
        .forEach((response) =>
          ApiResponse(response)(prototype, key, descriptor)
        );
    });
  } while (
    (prototype = Reflect.getPrototypeOf(prototype) as Type<any>) &&
    prototype !== Object.prototype &&
    prototype
  );
}

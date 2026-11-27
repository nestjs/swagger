import { Type } from '@nestjs/common';
import isFunction from 'es-toolkit/compat/isFunction';
import isString from 'es-toolkit/compat/isString';
import { getTypeIsArrayTuple } from '../decorators/helpers.js';
import { DECORATORS } from '../constants.js';
import { getSchemaPath } from '../utils/index.js';
import { CallBackObject } from '../interfaces/callback-object.interface.js';
import {
  ReferenceObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface.js';
import { SchemaObjectFactory } from '../services/schema-object-factory.js';
import {
  getBuiltInTypeSchema,
  isScalarType
} from '../utils/built-in-type-schema.util.js';

const mapCallbacksToSwaggerCallbacks = (
  callbacksData: CallBackObject<string | Function>[],
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory
) => {
  return callbacksData.reduce(
    (acc, callbackData: CallBackObject<string | Function>) => {
      const {
        name: eventName,
        callbackUrl,
        method: callbackMethod,
        requestBody,
        expectedResponse
      } = callbackData;
      const [type, isArray] = getTypeIsArrayTuple(requestBody.type, false);
      let schema: SchemaObject | ReferenceObject;
      if (isScalarType(type)) {
        // A built-in type has no component to reference, so it is documented
        // inline, like the type of a response
        schema = getBuiltInTypeSchema(type);
      } else if (isFunction(type)) {
        schemaObjectFactory.exploreModelSchema(type, schemas);
        schema = { $ref: getSchemaPath(type) };
      } else if (isString(type)) {
        // The name of a model, e.g. one added with @ApiExtraModels()
        schema = { $ref: getSchemaPath(type) };
      } else {
        schema = {};
      }
      if (isArray) {
        schema = { type: 'array', items: schema };
      }
      return {
        ...acc,
        [eventName]: {
          [callbackUrl]: {
            [callbackMethod]: {
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema
                  }
                }
              },
              responses: {
                [expectedResponse.status]: {
                  description:
                    expectedResponse.description ||
                    'Your server returns this code if it accepts the callback'
                }
              }
            }
          }
        }
      };
    },
    {}
  );
};

export const exploreGlobalApiCallbacksMetadata = (
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory,
  metatype: Type<unknown>
) => {
  const callbacksData = Reflect.getMetadata(DECORATORS.API_CALLBACKS, metatype);
  if (!callbacksData) {
    return undefined;
  }

  return {
    callbacks: mapCallbacksToSwaggerCallbacks(
      callbacksData,
      schemas,
      schemaObjectFactory
    )
  };
};

export const exploreApiCallbacksMetadata = (
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory,
  instance: object,
  prototype: Type<unknown>,
  method: object
) => {
  const callbacksData = Reflect.getMetadata(DECORATORS.API_CALLBACKS, method);
  if (!callbacksData) return callbacksData;

  return mapCallbacksToSwaggerCallbacks(
    callbacksData,
    schemas,
    schemaObjectFactory
  );
};

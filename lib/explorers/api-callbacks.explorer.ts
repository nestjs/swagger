import { Type } from '@nestjs/common';
import isFunction from 'es-toolkit/compat/isFunction';
import { DECORATORS } from '../constants.js';
import { getSchemaPath } from '../utils/index.js';
import { CallBackObject } from '../interfaces/callback-object.interface.js';
import { SchemaObject } from '../interfaces/open-api-spec.interface.js';
import { SchemaObjectFactory } from '../services/schema-object-factory.js';
import { isBuiltInType } from '../utils/is-built-in-type.util.js';

export const exploreApiCallbacksMetadata = (
  schemas: Record<string, SchemaObject>,
  schemaObjectFactory: SchemaObjectFactory,
  instance: object,
  prototype: Type<unknown>,
  method: object
) => {
  const callbacksData = Reflect.getMetadata(DECORATORS.API_CALLBACKS, method);
  if (!callbacksData) return callbacksData;

  return callbacksData.reduce(
    (acc, callbackData: CallBackObject<string | Function>) => {
      const {
        name: eventName,
        callbackUrl,
        method: callbackMethod,
        requestBody,
        expectedResponse
      } = callbackData;
      if (isFunction(requestBody.type) && !isBuiltInType(requestBody.type)) {
        schemaObjectFactory.exploreModelSchema(requestBody.type, schemas);
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
                    schema: {
                      $ref: getSchemaPath(requestBody.type)
                    }
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

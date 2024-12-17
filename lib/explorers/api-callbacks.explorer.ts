import { Type } from '@nestjs/common';
import { DECORATORS } from '../constants';
import { getSchemaPath } from '../utils';
import { CallBackObject } from '../interfaces/callback-object.interface';

export const exploreApiCallbacksMetadata = (
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

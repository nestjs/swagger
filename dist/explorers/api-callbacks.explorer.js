"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiCallbacksMetadata = void 0;
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const exploreApiCallbacksMetadata = (instance, prototype, method) => {
    const callbacksData = Reflect.getMetadata(constants_1.DECORATORS.API_CALLBACKS, method);
    if (!callbacksData)
        return callbacksData;
    return callbacksData.reduce((acc, callbackData) => {
        const { name: eventName, callbackUrl, method: callbackMethod, requestBody, expectedResponse } = callbackData;
        return Object.assign(Object.assign({}, acc), { [eventName]: {
                [callbackUrl]: {
                    [callbackMethod]: {
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: (0, utils_1.getSchemaPath)(requestBody.type)
                                    }
                                }
                            }
                        },
                        responses: {
                            [expectedResponse.status]: {
                                description: expectedResponse.description ||
                                    'Your server returns this code if it accepts the callback'
                            }
                        }
                    }
                }
            } });
    }, {});
};
exports.exploreApiCallbacksMetadata = exploreApiCallbacksMetadata;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCallbacks = ApiCallbacks;
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiCallbacks(...callbackObject) {
    return (0, helpers_1.createMixedDecorator)(constants_1.DECORATORS.API_CALLBACKS, callbackObject);
}

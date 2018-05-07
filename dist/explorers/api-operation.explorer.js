"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.exploreApiOperationMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(constants_1.DECORATORS.API_OPERATION, method);
};

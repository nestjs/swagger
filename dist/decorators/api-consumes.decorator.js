"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiConsumes = ApiConsumes;
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiConsumes(...mimeTypes) {
    return (0, helpers_1.createMixedDecorator)(constants_1.DECORATORS.API_CONSUMES, mimeTypes);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSchema = ApiSchema;
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiSchema(options) {
    return (0, helpers_1.createClassDecorator)(constants_1.DECORATORS.API_SCHEMA, [options]);
}

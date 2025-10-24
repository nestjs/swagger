"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiOperation = ApiOperation;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
const defaultOperationOptions = {
    summary: ''
};
function ApiOperation(options, { overrideExisting } = { overrideExisting: true }) {
    return (0, helpers_1.createMethodDecorator)(constants_1.DECORATORS.API_OPERATION, (0, lodash_1.pickBy)(Object.assign(Object.assign({}, defaultOperationOptions), options), (0, lodash_1.negate)(lodash_1.isUndefined)), { overrideExisting });
}

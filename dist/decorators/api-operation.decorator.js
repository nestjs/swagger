"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const initialMetadata = {
    summary: ''
};
exports.ApiOperation = (metadata) => {
    return helpers_1.createMethodDecorator(constants_1.DECORATORS.API_OPERATION, lodash_1.pickBy(Object.assign({}, initialMetadata, { summary: lodash_1.isNil(metadata.title)
            ? initialMetadata.summary
            : metadata.title, description: metadata.description, operationId: metadata.operationId }), lodash_1.negate(lodash_1.isUndefined)));
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const initialMetadata = {
    name: '',
    required: true
};
exports.ApiImplicitHeader = (metadata) => {
    const param = {
        name: lodash_1.isNil(metadata.name) ? initialMetadata.name : metadata.name,
        in: 'header',
        description: metadata.description,
        required: metadata.required,
        type: String
    };
    return helpers_1.createParamDecorator(param, initialMetadata);
};
exports.ApiImplicitHeaders = (headers) => {
    const multiMetadata = headers.map(metadata => ({
        name: lodash_1.isNil(metadata.name) ? initialMetadata.name : metadata.name,
        in: 'header',
        description: metadata.description,
        required: metadata.required,
        type: String
    }));
    return helpers_1.createMultipleParamDecorator(multiMetadata, initialMetadata);
};

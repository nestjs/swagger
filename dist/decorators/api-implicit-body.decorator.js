"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const initialMetadata = {
    name: '',
    required: true
};
exports.ApiImplicitBody = (metadata) => {
    const param = {
        name: lodash_1.isNil(metadata.name) ? initialMetadata.name : metadata.name,
        in: 'body',
        description: metadata.description,
        required: metadata.required,
        type: metadata.type,
        isArray: metadata.isArray
    };
    return helpers_1.createParamDecorator(param, initialMetadata);
};

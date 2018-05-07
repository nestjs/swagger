"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const lodash_1 = require("lodash");
const initialMetadata = {
    status: 0,
    type: String,
    isArray: false
};
exports.ApiResponse = (metadata) => {
    metadata.description = metadata.description ? metadata.description : '';
    const groupedMetadata = { [metadata.status]: lodash_1.omit(metadata, 'status') };
    return (target, key, descriptor) => {
        if (descriptor) {
            const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, descriptor.value) || {};
            Reflect.defineMetadata(constants_1.DECORATORS.API_RESPONSE, Object.assign({}, responses, groupedMetadata), descriptor.value);
            return descriptor;
        }
        const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, target) || {};
        Reflect.defineMetadata(constants_1.DECORATORS.API_RESPONSE, Object.assign({}, responses, groupedMetadata), target);
        return target;
    };
};

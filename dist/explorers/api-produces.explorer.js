"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const defaultProduces = 'application/json';
exports.exploreGlobalApiProducesMetadata = metatype => {
    const produces = Reflect.getMetadata(constants_1.DECORATORS.API_PRODUCES, metatype);
    return produces
        ? { produces }
        : {
            produces: [defaultProduces]
        };
};
exports.exploreApiProducesMetadata = (instance, prototype, method) => {
    return (Reflect.getMetadata(constants_1.DECORATORS.API_PRODUCES, method) || [defaultProduces]);
};

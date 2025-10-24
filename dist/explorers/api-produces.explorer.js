"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiProducesMetadata = exports.exploreGlobalApiProducesMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiProducesMetadata = (metatype) => {
    const produces = Reflect.getMetadata(constants_1.DECORATORS.API_PRODUCES, metatype);
    return produces ? { produces } : undefined;
};
exports.exploreGlobalApiProducesMetadata = exploreGlobalApiProducesMetadata;
const exploreApiProducesMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_PRODUCES, method);
exports.exploreApiProducesMetadata = exploreApiProducesMetadata;

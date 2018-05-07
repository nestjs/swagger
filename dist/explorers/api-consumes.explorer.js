"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.exploreGlobalApiConsumesMetadata = metatype => {
    const consumes = Reflect.getMetadata(constants_1.DECORATORS.API_CONSUMES, metatype);
    return consumes ? { consumes } : undefined;
};
exports.exploreApiConsumesMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(constants_1.DECORATORS.API_CONSUMES, method);
};

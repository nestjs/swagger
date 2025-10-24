"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiConsumesMetadata = exports.exploreGlobalApiConsumesMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiConsumesMetadata = (metatype) => {
    const consumes = Reflect.getMetadata(constants_1.DECORATORS.API_CONSUMES, metatype);
    return consumes ? { consumes } : undefined;
};
exports.exploreGlobalApiConsumesMetadata = exploreGlobalApiConsumesMetadata;
const exploreApiConsumesMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_CONSUMES, method);
exports.exploreApiConsumesMetadata = exploreApiConsumesMetadata;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiExtraModelsMetadata = exports.exploreGlobalApiExtraModelsMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiExtraModelsMetadata = (metatype) => {
    const extraModels = Reflect.getMetadata(constants_1.DECORATORS.API_EXTRA_MODELS, metatype);
    return extraModels || [];
};
exports.exploreGlobalApiExtraModelsMetadata = exploreGlobalApiExtraModelsMetadata;
const exploreApiExtraModelsMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_EXTRA_MODELS, method) || [];
exports.exploreApiExtraModelsMetadata = exploreApiExtraModelsMetadata;

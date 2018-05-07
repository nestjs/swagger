"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.exploreGlobalApiUseTagsMetadata = metatype => {
    const tags = Reflect.getMetadata(constants_1.DECORATORS.API_USE_TAGS, metatype);
    return tags ? { tags } : undefined;
};
exports.exploreApiUseTagsMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(constants_1.DECORATORS.API_USE_TAGS, method);
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiTagsMetadata = exports.exploreGlobalApiTagsMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiTagsMetadata = (autoTagControllers) => (metatype) => {
    const decoratorTags = Reflect.getMetadata(constants_1.DECORATORS.API_TAGS, metatype);
    const isEmpty = !decoratorTags || decoratorTags.length === 0;
    if (isEmpty && autoTagControllers) {
        const defaultTag = metatype.name.replace(/Controller$/, '');
        return {
            tags: [defaultTag]
        };
    }
    return isEmpty ? undefined : { tags: decoratorTags };
};
exports.exploreGlobalApiTagsMetadata = exploreGlobalApiTagsMetadata;
const exploreApiTagsMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_TAGS, method);
exports.exploreApiTagsMetadata = exploreApiTagsMetadata;

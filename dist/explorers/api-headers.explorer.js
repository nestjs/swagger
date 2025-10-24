"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreGlobalApiHeaderMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiHeaderMetadata = (metatype) => {
    const headers = Reflect.getMetadata(constants_1.DECORATORS.API_HEADERS, metatype);
    return headers ? { root: { parameters: headers }, depth: 1 } : undefined;
};
exports.exploreGlobalApiHeaderMetadata = exploreGlobalApiHeaderMetadata;

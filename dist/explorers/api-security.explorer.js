"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiSecurityMetadata = exports.exploreGlobalApiSecurityMetadata = void 0;
const constants_1 = require("../constants");
const exploreGlobalApiSecurityMetadata = (metatype) => {
    const security = Reflect.getMetadata(constants_1.DECORATORS.API_SECURITY, metatype);
    return security ? { security } : undefined;
};
exports.exploreGlobalApiSecurityMetadata = exploreGlobalApiSecurityMetadata;
const exploreApiSecurityMetadata = (instance, prototype, method) => {
    return Reflect.getMetadata(constants_1.DECORATORS.API_SECURITY, method);
};
exports.exploreApiSecurityMetadata = exploreApiSecurityMetadata;

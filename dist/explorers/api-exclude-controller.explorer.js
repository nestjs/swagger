"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiExcludeControllerMetadata = void 0;
const constants_1 = require("../constants");
const exploreApiExcludeControllerMetadata = (metatype) => {
    var _a;
    return ((_a = Reflect.getMetadata(constants_1.DECORATORS.API_EXCLUDE_CONTROLLER, metatype)) === null || _a === void 0 ? void 0 : _a[0]) ===
        true;
};
exports.exploreApiExcludeControllerMetadata = exploreApiExcludeControllerMetadata;

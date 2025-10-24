"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTags = ApiTags;
const constants_1 = require("../constants");
const helpers_1 = require("./helpers");
function ApiTags(...tags) {
    return (0, helpers_1.createMixedDecorator)(constants_1.DECORATORS.API_TAGS, tags);
}

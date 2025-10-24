"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiExcludeEndpointMetadata = void 0;
const constants_1 = require("../constants");
const exploreApiExcludeEndpointMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_EXCLUDE_ENDPOINT, method);
exports.exploreApiExcludeEndpointMetadata = exploreApiExcludeEndpointMetadata;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiIncludeEndpointMetadata = void 0;
const constants_1 = require("../constants");
const exploreApiIncludeEndpointMetadata = (instance, prototype, method) => Reflect.getMetadata(constants_1.DECORATORS.API_INCLUDE_ENDPOINT, method);
exports.exploreApiIncludeEndpointMetadata = exploreApiIncludeEndpointMetadata;

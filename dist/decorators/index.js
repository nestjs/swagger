"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseProperty = exports.ApiPropertyOptional = exports.ApiProperty = void 0;
__exportStar(require("./api-basic.decorator"), exports);
__exportStar(require("./api-bearer.decorator"), exports);
__exportStar(require("./api-body.decorator"), exports);
__exportStar(require("./api-consumes.decorator"), exports);
__exportStar(require("./api-cookie.decorator"), exports);
__exportStar(require("./api-default-getter.decorator"), exports);
__exportStar(require("./api-exclude-endpoint.decorator"), exports);
__exportStar(require("./api-include-endpoint.decorator"), exports);
__exportStar(require("./api-exclude-controller.decorator"), exports);
__exportStar(require("./api-extra-models.decorator"), exports);
__exportStar(require("./api-header.decorator"), exports);
__exportStar(require("./api-hide-property.decorator"), exports);
__exportStar(require("./api-link.decorator"), exports);
__exportStar(require("./api-oauth2.decorator"), exports);
__exportStar(require("./api-operation.decorator"), exports);
__exportStar(require("./api-param.decorator"), exports);
__exportStar(require("./api-produces.decorator"), exports);
var api_property_decorator_1 = require("./api-property.decorator");
Object.defineProperty(exports, "ApiProperty", { enumerable: true, get: function () { return api_property_decorator_1.ApiProperty; } });
Object.defineProperty(exports, "ApiPropertyOptional", { enumerable: true, get: function () { return api_property_decorator_1.ApiPropertyOptional; } });
Object.defineProperty(exports, "ApiResponseProperty", { enumerable: true, get: function () { return api_property_decorator_1.ApiResponseProperty; } });
__exportStar(require("./api-query.decorator"), exports);
__exportStar(require("./api-response.decorator"), exports);
__exportStar(require("./api-security.decorator"), exports);
__exportStar(require("./api-use-tags.decorator"), exports);
__exportStar(require("./api-callbacks.decorator"), exports);
__exportStar(require("./api-extension.decorator"), exports);
__exportStar(require("./api-schema.decorator"), exports);

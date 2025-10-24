"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBodyParameter = isBodyParameter;
function isBodyParameter(param) {
    return param.in === 'body';
}

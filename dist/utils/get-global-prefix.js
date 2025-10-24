"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalPrefix = getGlobalPrefix;
function getGlobalPrefix(app) {
    const internalConfigRef = app.config;
    return (internalConfigRef && internalConfigRef.getGlobalPrefix()) || '';
}

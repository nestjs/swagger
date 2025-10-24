"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGlobalPrefix = void 0;
const validateGlobalPrefix = (globalPrefix) => globalPrefix && !globalPrefix.match(/^(\/?)$/);
exports.validateGlobalPrefix = validateGlobalPrefix;

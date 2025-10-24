"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRelPath = normalizeRelPath;
function normalizeRelPath(input) {
    const output = input.replace(/\/\/+/g, '/');
    return output;
}

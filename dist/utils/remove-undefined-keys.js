"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUndefinedKeys = removeUndefinedKeys;
function removeUndefinedKeys(obj) {
    Object.entries(obj).forEach(([key, value]) => {
        if (value === undefined) {
            delete obj[key];
        }
    });
    return obj;
}

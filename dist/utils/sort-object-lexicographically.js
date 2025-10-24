"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortObjectLexicographically = sortObjectLexicographically;
function sortObjectLexicographically(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = obj[key];
    }
    return sortedObj;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripLastSlash = stripLastSlash;
function stripLastSlash(path) {
    return path && path[path.length - 1] === '/'
        ? path.slice(0, path.length - 1)
        : path;
}

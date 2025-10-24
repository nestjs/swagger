"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePath = resolvePath;
const pathLib = require("path");
function resolvePath(path) {
    return path ? pathLib.resolve(path) : path;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFilenameMatched = void 0;
const isFilenameMatched = (patterns, filename) => patterns.some((path) => filename.includes(path));
exports.isFilenameMatched = isFilenameMatched;

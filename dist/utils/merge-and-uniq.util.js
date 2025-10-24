"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAndUniq = mergeAndUniq;
const lodash_1 = require("lodash");
function mergeAndUniq(a = [], b = []) {
    return (0, lodash_1.uniq)((0, lodash_1.merge)(a, b));
}

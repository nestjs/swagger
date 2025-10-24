"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTwoLevelsDeep = assignTwoLevelsDeep;
function assignTwoLevelsDeep(_dest, ...args) {
    const dest = _dest;
    for (const arg of args) {
        for (const [key, value] of Object.entries(arg !== null && arg !== void 0 ? arg : {})) {
            dest[key] = Object.assign(Object.assign({}, dest[key]), value);
        }
    }
    return dest;
}

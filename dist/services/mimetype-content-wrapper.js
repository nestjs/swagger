"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimetypeContentWrapper = void 0;
const remove_undefined_keys_1 = require("../utils/remove-undefined-keys");
class MimetypeContentWrapper {
    wrap(mimetype, obj) {
        const content = mimetype.reduce((acc, item) => (Object.assign(Object.assign({}, acc), { [item]: (0, remove_undefined_keys_1.removeUndefinedKeys)(obj) })), {});
        return { content };
    }
}
exports.MimetypeContentWrapper = MimetypeContentWrapper;

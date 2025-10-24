"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiBody = ApiBody;
const lodash_1 = require("lodash");
const enum_utils_1 = require("../utils/enum.utils");
const helpers_1 = require("./helpers");
const defaultBodyMetadata = {
    type: String,
    required: true
};
function ApiBody(options) {
    const [type, isArray] = (0, helpers_1.getTypeIsArrayTuple)(options.type, options.isArray);
    const param = Object.assign(Object.assign({ in: 'body' }, (0, lodash_1.omit)(options, 'enum')), { type,
        isArray });
    if ((0, enum_utils_1.isEnumArray)(options)) {
        (0, enum_utils_1.addEnumArraySchema)(param, options);
    }
    else if ((0, enum_utils_1.isEnumDefined)(options)) {
        (0, enum_utils_1.addEnumSchema)(param, options);
    }
    return (0, helpers_1.createParamDecorator)(param, defaultBodyMetadata);
}

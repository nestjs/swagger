"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiParam = ApiParam;
const lodash_1 = require("lodash");
const enum_utils_1 = require("../utils/enum.utils");
const helpers_1 = require("./helpers");
const defaultParamOptions = {
    name: '',
    required: true
};
function ApiParam(options) {
    const param = Object.assign({ name: (0, lodash_1.isNil)(options.name) ? defaultParamOptions.name : options.name, in: 'path' }, (0, lodash_1.omit)(options, 'enum'));
    if ((0, enum_utils_1.isEnumDefined)(options)) {
        (0, enum_utils_1.addEnumSchema)(param, options);
    }
    return (0, helpers_1.createParamDecorator)(param, defaultParamOptions);
}

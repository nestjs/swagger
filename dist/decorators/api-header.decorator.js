"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiHeaders = void 0;
exports.ApiHeader = ApiHeader;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const enum_utils_1 = require("../utils/enum.utils");
const helpers_1 = require("./helpers");
const defaultHeaderOptions = {
    name: ''
};
function ApiHeader(options) {
    const param = (0, lodash_1.pickBy)({
        name: (0, lodash_1.isNil)(options.name) ? defaultHeaderOptions.name : options.name,
        in: 'header',
        description: options.description,
        required: options.required,
        examples: options.examples,
        schema: Object.assign({ type: 'string' }, (options.schema || {}))
    }, (0, lodash_1.negate)(lodash_1.isUndefined));
    if (options.enum) {
        const enumValues = (0, enum_utils_1.getEnumValues)(options.enum);
        param.schema = Object.assign(Object.assign({}, param.schema), { enum: enumValues, type: (0, enum_utils_1.getEnumType)(enumValues) });
    }
    return (target, key, descriptor) => {
        if (descriptor) {
            return (0, helpers_1.createParamDecorator)(param, defaultHeaderOptions)(target, key, descriptor);
        }
        return (0, helpers_1.createClassDecorator)(constants_1.DECORATORS.API_HEADERS, [param])(target);
    };
}
const ApiHeaders = (headers) => {
    return (target, key, descriptor) => {
        headers.forEach((options) => ApiHeader(options)(target, key, descriptor));
    };
};
exports.ApiHeaders = ApiHeaders;

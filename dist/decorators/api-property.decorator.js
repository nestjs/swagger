"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProperty = ApiProperty;
exports.createApiPropertyDecorator = createApiPropertyDecorator;
exports.ApiPropertyOptional = ApiPropertyOptional;
exports.ApiResponseProperty = ApiResponseProperty;
const constants_1 = require("../constants");
const enum_utils_1 = require("../utils/enum.utils");
const helpers_1 = require("./helpers");
const isEnumArray = (opts) => opts.isArray && 'enum' in opts && opts.enum !== undefined;
function ApiProperty(options = {}) {
    return createApiPropertyDecorator(options);
}
function createApiPropertyDecorator(options = {}, overrideExisting = true) {
    const [type, isArray] = (0, helpers_1.getTypeIsArrayTuple)(options.type, options.isArray);
    options = Object.assign(Object.assign({}, options), { type,
        isArray });
    if (isEnumArray(options)) {
        options.type = 'array';
        const enumValues = (0, enum_utils_1.getEnumValues)(options.enum);
        options.items = {
            type: (0, enum_utils_1.getEnumType)(enumValues),
            enum: enumValues
        };
        delete options.enum;
    }
    else if ('enum' in options && options.enum !== undefined) {
        const enumValues = (0, enum_utils_1.getEnumValues)(options.enum);
        options.enum = enumValues;
        options.type = (0, enum_utils_1.getEnumType)(enumValues);
    }
    if (Array.isArray(options.type)) {
        options.type = 'array';
        options.items = {
            type: 'array',
            items: {
                type: options.type[0]
            }
        };
    }
    return (0, helpers_1.createPropertyDecorator)(constants_1.DECORATORS.API_MODEL_PROPERTIES, options, overrideExisting);
}
function ApiPropertyOptional(options = {}) {
    return ApiProperty(Object.assign(Object.assign({}, options), { required: false }));
}
function ApiResponseProperty(options = {}) {
    return ApiProperty(Object.assign({ readOnly: true }, options));
}

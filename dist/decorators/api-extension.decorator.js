"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExtension = ApiExtension;
const constants_1 = require("@nestjs/common/constants");
const constants_2 = require("../constants");
const lodash_1 = require("lodash");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
function applyExtension(target, key, value) {
    const extensions = Reflect.getMetadata(constants_2.DECORATORS.API_EXTENSION, target) || {};
    Reflect.defineMetadata(constants_2.DECORATORS.API_EXTENSION, Object.assign({ [key]: value }, extensions), target);
}
function ApiExtension(extensionKey, extensionProperties) {
    if (!extensionKey.startsWith('x-')) {
        throw new Error('Extension key is not prefixed. Please ensure you prefix it with `x-`.');
    }
    return (target, key, descriptor) => {
        const extensionValue = (0, lodash_1.clone)(extensionProperties);
        if (descriptor) {
            applyExtension(descriptor.value, extensionKey, extensionValue);
            return descriptor;
        }
        if (typeof target === 'object') {
            return target;
        }
        const apiMethods = Object.getOwnPropertyNames(target.prototype)
            .filter((propertyKey) => !(0, shared_utils_1.isConstructor)(propertyKey))
            .map((propertyKey) => { var _a; return (_a = Object.getOwnPropertyDescriptor(target.prototype, propertyKey)) === null || _a === void 0 ? void 0 : _a.value; })
            .filter((methodDescriptor) => methodDescriptor !== undefined && Reflect.hasMetadata(constants_1.METHOD_METADATA, methodDescriptor));
        if (apiMethods.length > 0) {
            apiMethods.forEach((method) => applyExtension(method, extensionKey, extensionValue));
        }
        else {
            applyExtension(target, extensionKey, extensionValue);
        }
        return target;
    };
}

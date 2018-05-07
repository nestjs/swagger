"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
exports.createMethodDecorator = (metakey, metadata) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(metakey, metadata, descriptor.value);
        return descriptor;
    };
};
exports.createClassDecorator = (metakey, metadata) => {
    return target => {
        Reflect.defineMetadata(metakey, metadata, target);
        return target;
    };
};
exports.createPropertyDecorator = (metakey, metadata) => {
    return (target, propertyKey) => {
        const properties = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES_ARRAY, target) || [];
        Reflect.defineMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES_ARRAY, [...properties, `:${propertyKey}`], target);
        Reflect.defineMetadata(metakey, Object.assign({ type: Reflect.getMetadata('design:type', target, propertyKey) }, metadata), target, propertyKey);
    };
};
exports.createMixedDecorator = (metakey, metadata) => {
    return (target, key, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(metakey, metadata, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata(metakey, metadata, target);
        return target;
    };
};
exports.createParamDecorator = (metadata, initial) => {
    return (target, key, descriptor) => {
        const parameters = Reflect.getMetadata(constants_1.DECORATORS.API_PARAMETERS, descriptor.value) || [];
        Reflect.defineMetadata(constants_1.DECORATORS.API_PARAMETERS, [
            ...parameters,
            Object.assign({}, initial, lodash_1.pickBy(metadata, lodash_1.negate(lodash_1.isUndefined)))
        ], descriptor.value);
        return descriptor;
    };
};
exports.createMultipleParamDecorator = (multiMetadata, initial) => {
    return (target, key, descriptor) => {
        const parameters = Reflect.getMetadata(constants_1.DECORATORS.API_PARAMETERS, descriptor.value) || [];
        Reflect.defineMetadata(constants_1.DECORATORS.API_PARAMETERS, [
            ...parameters,
            ...multiMetadata.map(metadata => (Object.assign({}, initial, lodash_1.pickBy(metadata, lodash_1.negate(lodash_1.isUndefined)))))
        ], descriptor.value);
        return descriptor;
    };
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiOperationMetadata = void 0;
const constants_1 = require("../constants");
const api_operation_decorator_1 = require("../decorators/api-operation.decorator");
const plugin_constants_1 = require("../plugin/plugin-constants");
const exploreApiOperationMetadata = (instance, prototype, method) => {
    applyMetadataFactory(prototype, instance);
    return Reflect.getMetadata(constants_1.DECORATORS.API_OPERATION, method);
};
exports.exploreApiOperationMetadata = exploreApiOperationMetadata;
function applyMetadataFactory(prototype, instance) {
    const classPrototype = prototype;
    do {
        if (!prototype.constructor) {
            return;
        }
        if (!prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]) {
            continue;
        }
        const metadata = prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]();
        const methodKeys = Object.keys(metadata).filter((key) => typeof instance[key] === 'function');
        methodKeys.forEach((key) => {
            const operationMeta = {};
            const { summary, deprecated, tags, description } = metadata[key];
            applyIfNotNil(operationMeta, 'summary', summary);
            applyIfNotNil(operationMeta, 'deprecated', deprecated);
            applyIfNotNil(operationMeta, 'tags', tags);
            applyIfNotNil(operationMeta, 'description', description);
            if (Object.keys(operationMeta).length === 0) {
                return;
            }
            (0, api_operation_decorator_1.ApiOperation)(operationMeta, { overrideExisting: false })(classPrototype, key, Object.getOwnPropertyDescriptor(classPrototype, key));
        });
    } while ((prototype = Reflect.getPrototypeOf(prototype)) &&
        prototype !== Object.prototype &&
        prototype);
}
function applyIfNotNil(target, key, value) {
    if (value !== undefined && value !== null) {
        target[key] = value;
    }
}

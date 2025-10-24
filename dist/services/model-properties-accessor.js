"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelPropertiesAccessor = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
require("reflect-metadata");
const constants_1 = require("../constants");
const api_property_decorator_1 = require("../decorators/api-property.decorator");
const plugin_constants_1 = require("../plugin/plugin-constants");
class ModelPropertiesAccessor {
    getModelProperties(prototype) {
        const properties = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) ||
            [];
        return properties
            .filter(shared_utils_1.isString)
            .filter((key) => key.charAt(0) === ':' && !(0, shared_utils_1.isFunction)(prototype[key]))
            .map((key) => key.slice(1));
    }
    applyMetadataFactory(prototype) {
        const classPrototype = prototype;
        do {
            if (!prototype.constructor) {
                return;
            }
            if (!prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]) {
                continue;
            }
            const metadata = prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]();
            const properties = Object.keys(metadata);
            properties.forEach((key) => {
                (0, api_property_decorator_1.createApiPropertyDecorator)(metadata[key], false)(classPrototype, key);
            });
        } while ((prototype = Reflect.getPrototypeOf(prototype)) &&
            prototype !== Object.prototype &&
            prototype);
    }
}
exports.ModelPropertiesAccessor = ModelPropertiesAccessor;

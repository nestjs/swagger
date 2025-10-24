"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialType = PartialType;
const mapped_types_1 = require("@nestjs/mapped-types");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const decorators_1 = require("../decorators");
const metadata_loader_1 = require("../plugin/metadata-loader");
const plugin_constants_1 = require("../plugin/plugin-constants");
const model_properties_accessor_1 = require("../services/model-properties-accessor");
const mapped_types_utils_1 = require("./mapped-types.utils");
const modelPropertiesAccessor = new model_properties_accessor_1.ModelPropertiesAccessor();
function PartialType(classRef, options = {}) {
    const applyPartialDecoratorFn = options.skipNullProperties === false
        ? mapped_types_1.applyValidateIfDefinedDecorator
        : mapped_types_1.applyIsOptionalDecorator;
    const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);
    class PartialTypeClass {
        constructor() {
            (0, mapped_types_1.inheritPropertyInitializers)(this, classRef);
        }
    }
    const keysWithValidationConstraints = (0, mapped_types_1.inheritValidationMetadata)(classRef, PartialTypeClass);
    if (keysWithValidationConstraints) {
        keysWithValidationConstraints
            .filter((key) => !fields.includes(key))
            .forEach((key) => applyPartialDecoratorFn(PartialTypeClass, key));
    }
    (0, mapped_types_1.inheritTransformationMetadata)(classRef, PartialTypeClass);
    function applyFields(fields) {
        (0, mapped_types_utils_1.clonePluginMetadataFactory)(PartialTypeClass, classRef.prototype, (metadata) => (0, lodash_1.mapValues)(metadata, (item) => (Object.assign(Object.assign({}, item), { required: false }))));
        if (PartialTypeClass[plugin_constants_1.METADATA_FACTORY_NAME]) {
            const pluginFields = Object.keys(PartialTypeClass[plugin_constants_1.METADATA_FACTORY_NAME]());
            pluginFields.forEach((key) => applyPartialDecoratorFn(PartialTypeClass, key));
        }
        fields.forEach((key) => {
            const metadata = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, classRef.prototype, key) || {};
            const decoratorFactory = (0, decorators_1.ApiProperty)(Object.assign(Object.assign({}, metadata), { required: false }));
            decoratorFactory(PartialTypeClass.prototype, key);
            applyPartialDecoratorFn(PartialTypeClass, key);
        });
    }
    applyFields(fields);
    metadata_loader_1.MetadataLoader.addRefreshHook(() => {
        const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);
        applyFields(fields);
    });
    return PartialTypeClass;
}

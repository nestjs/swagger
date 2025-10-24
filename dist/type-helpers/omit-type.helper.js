"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmitType = OmitType;
const mapped_types_1 = require("@nestjs/mapped-types");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const decorators_1 = require("../decorators");
const metadata_loader_1 = require("../plugin/metadata-loader");
const model_properties_accessor_1 = require("../services/model-properties-accessor");
const mapped_types_utils_1 = require("./mapped-types.utils");
const modelPropertiesAccessor = new model_properties_accessor_1.ModelPropertiesAccessor();
function OmitType(classRef, keys) {
    const fields = modelPropertiesAccessor
        .getModelProperties(classRef.prototype)
        .filter((item) => !keys.includes(item));
    const isInheritedPredicate = (propertyKey) => !keys.includes(propertyKey);
    class OmitTypeClass {
        constructor() {
            (0, mapped_types_1.inheritPropertyInitializers)(this, classRef, isInheritedPredicate);
        }
    }
    (0, mapped_types_1.inheritValidationMetadata)(classRef, OmitTypeClass, isInheritedPredicate);
    (0, mapped_types_1.inheritTransformationMetadata)(classRef, OmitTypeClass, isInheritedPredicate);
    function applyFields(fields) {
        (0, mapped_types_utils_1.clonePluginMetadataFactory)(OmitTypeClass, classRef.prototype, (metadata) => (0, lodash_1.omit)(metadata, keys));
        fields.forEach((propertyKey) => {
            const metadata = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, classRef.prototype, propertyKey);
            const decoratorFactory = (0, decorators_1.ApiProperty)(metadata);
            decoratorFactory(OmitTypeClass.prototype, propertyKey);
        });
    }
    applyFields(fields);
    metadata_loader_1.MetadataLoader.addRefreshHook(() => {
        const fields = modelPropertiesAccessor
            .getModelProperties(classRef.prototype)
            .filter((item) => !keys.includes(item));
        applyFields(fields);
    });
    return OmitTypeClass;
}

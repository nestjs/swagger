"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntersectionType = IntersectionType;
const mapped_types_1 = require("@nestjs/mapped-types");
const constants_1 = require("../constants");
const decorators_1 = require("../decorators");
const metadata_loader_1 = require("../plugin/metadata-loader");
const model_properties_accessor_1 = require("../services/model-properties-accessor");
const mapped_types_utils_1 = require("./mapped-types.utils");
const modelPropertiesAccessor = new model_properties_accessor_1.ModelPropertiesAccessor();
function IntersectionType(...classRefs) {
    class IntersectionClassType {
        constructor() {
            classRefs.forEach((classRef) => {
                (0, mapped_types_1.inheritPropertyInitializers)(this, classRef);
            });
        }
    }
    classRefs.forEach((classRef) => {
        const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);
        (0, mapped_types_1.inheritValidationMetadata)(classRef, IntersectionClassType);
        (0, mapped_types_1.inheritTransformationMetadata)(classRef, IntersectionClassType);
        function applyFields(fields) {
            (0, mapped_types_utils_1.clonePluginMetadataFactory)(IntersectionClassType, classRef.prototype);
            fields.forEach((propertyKey) => {
                const metadata = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, classRef.prototype, propertyKey);
                const decoratorFactory = (0, decorators_1.ApiProperty)(metadata);
                decoratorFactory(IntersectionClassType.prototype, propertyKey);
            });
        }
        applyFields(fields);
        metadata_loader_1.MetadataLoader.addRefreshHook(() => {
            const fields = modelPropertiesAccessor.getModelProperties(classRef.prototype);
            applyFields(fields);
        });
    });
    const intersectedNames = classRefs.reduce((prev, ref) => prev + ref.name, '');
    Object.defineProperty(IntersectionClassType, 'name', {
        value: `Intersection${intersectedNames}`
    });
    return IntersectionClassType;
}

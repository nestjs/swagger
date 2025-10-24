"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParametersMetadataMapper = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const is_body_parameter_util_1 = require("../utils/is-body-parameter.util");
class ParametersMetadataMapper {
    constructor(modelPropertiesAccessor) {
        this.modelPropertiesAccessor = modelPropertiesAccessor;
    }
    transformModelToProperties(parameters) {
        const properties = (0, lodash_1.flatMap)(parameters, (param) => {
            if (!param || param.type === Object || !param.type) {
                return undefined;
            }
            if (param.name) {
                return param;
            }
            if ((0, is_body_parameter_util_1.isBodyParameter)(param)) {
                const isCtor = param.type && (0, shared_utils_1.isFunction)(param.type);
                const name = isCtor ? param.type.name : param.type;
                return Object.assign(Object.assign({}, param), { name });
            }
            const { prototype } = param.type;
            this.modelPropertiesAccessor.applyMetadataFactory(prototype);
            const modelProperties = this.modelPropertiesAccessor.getModelProperties(prototype);
            return modelProperties.map((key) => this.mergeImplicitWithExplicit(key, prototype, param));
        });
        return properties.filter(lodash_1.identity);
    }
    mergeImplicitWithExplicit(key, prototype, param) {
        const reflectedParam = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
            {};
        return Object.assign(Object.assign(Object.assign({}, param), reflectedParam), { name: reflectedParam.name || key });
    }
}
exports.ParametersMetadataMapper = ParametersMetadataMapper;

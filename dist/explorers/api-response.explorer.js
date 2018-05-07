"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_parameters_explorer_1 = require("./api-parameters.explorer");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
exports.exploreGlobalApiResponseMetadata = (definitions, metatype) => {
    const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, metatype);
    return responses
        ? {
            responses: mapResponsesToSwaggerResponses(responses, definitions)
        }
        : undefined;
};
exports.exploreApiResponseMetadata = (definitions, instance, prototype, method) => {
    const responses = Reflect.getMetadata(constants_1.DECORATORS.API_RESPONSE, method);
    if (!responses) {
        return undefined;
    }
    return mapResponsesToSwaggerResponses(responses, definitions);
};
const mapResponsesToSwaggerResponses = (responses, definitions) => lodash_1.mapValues(responses, response => {
    const { type, isArray } = response;
    response = lodash_1.omit(response, ['isArray']);
    if (!type)
        return response;
    const defaultTypes = [String, Boolean, Number, Object, Array];
    if (!(shared_utils_1.isFunction(type) &&
        !defaultTypes.find(defaultType => defaultType === type))) {
        const metatype = type && shared_utils_1.isFunction(type) ? type.name : type;
        const swaggerType = api_parameters_explorer_1.mapTypesToSwaggerTypes(metatype);
        return Object.assign({}, response, { schema: {
                type: swaggerType
            } });
    }
    const name = api_parameters_explorer_1.exploreModelDefinition(type, definitions);
    if (isArray) {
        return exports.toArrayResponseWithDefinition(response, name);
    }
    return exports.toResponseWithDefinition(response, name);
});
exports.toArrayResponseWithDefinition = (response, name) => (Object.assign({}, response, { schema: {
        type: 'array',
        items: {
            $ref: `#/definitions/${name}`
        }
    } }));
exports.toResponseWithDefinition = (response, name) => (Object.assign({}, response, { schema: {
        $ref: `#/definitions/${name}`
    } }));

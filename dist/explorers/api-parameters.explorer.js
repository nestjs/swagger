"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const constants_2 = require("@nestjs/common/constants");
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
const lodash_1 = require("lodash");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
exports.exploreApiParametersMetadata = (definitions, instance, prototype, method) => {
    const implicitParameters = Reflect.getMetadata(constants_1.DECORATORS.API_PARAMETERS, method);
    const reflectedParameters = exploreApiReflectedParametersMetadata(instance, prototype, method);
    const noAnyImplicit = lodash_1.isNil(implicitParameters);
    if (noAnyImplicit && lodash_1.isNil(reflectedParameters)) {
        return undefined;
    }
    const allReflectedParameters = transformModelToProperties(reflectedParameters || []);
    const mergedParameters = noAnyImplicit
        ? allReflectedParameters
        : lodash_1.map(allReflectedParameters, item => lodash_1.assign(item, lodash_1.find(implicitParameters, ['name', item.name])));
    const unionParameters = noAnyImplicit
        ? mergedParameters
        : lodash_1.unionWith(mergedParameters, implicitParameters, (arrVal, othVal) => {
            return arrVal.name === othVal.name && arrVal.in === othVal.in;
        });
    const paramsWithDefinitions = mapModelsToDefinitons(unionParameters, definitions);
    const parameters = mapParametersTypes(paramsWithDefinitions);
    return parameters ? { parameters } : undefined;
};
const DEFAULT_PARAM_TOKEN = '_';
const exploreApiReflectedParametersMetadata = (instance, prototype, method) => {
    const types = Reflect.getMetadata(constants_2.PARAMTYPES_METADATA, instance, method.name);
    const parametersMetadata = Reflect.getMetadata(constants_2.ROUTE_ARGS_METADATA, instance, method.name) || {};
    const parametersWithType = lodash_1.mapValues(parametersMetadata, param => ({
        type: types[param.index],
        name: param.data,
        required: true
    }));
    const parameters = lodash_1.omitBy(lodash_1.mapValues(parametersWithType, (val, key) => (Object.assign({}, val, { in: mapParamType(key) }))), val => val.in === DEFAULT_PARAM_TOKEN || (val.name && val.in === 'body'));
    return !lodash_1.isEmpty(parameters) ? parameters : undefined;
};
const exploreModelProperties = prototype => {
    const props = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES_ARRAY, prototype) || [];
    return props
        .filter(lodash_1.isString)
        .filter(prop => prop.charAt(0) === ':' && !shared_utils_1.isFunction(prototype[prop]))
        .map(prop => prop.slice(1));
};
const isBodyParameter = param => param.in === 'body';
const transformModelToProperties = reflectedParameters => {
    return lodash_1.flatMap(reflectedParameters, (param) => {
        if (!param) {
            return null;
        }
        const { prototype } = param.type;
        if (param.name)
            return param;
        if (isBodyParameter(param)) {
            const name = param.type && shared_utils_1.isFunction(param.type) ? param.type.name : param.type;
            return Object.assign({}, param, { name });
        }
        const modelProperties = exploreModelProperties(prototype);
        return modelProperties.map(key => {
            const reflectedParam = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
                {};
            return Object.assign({}, param, reflectedParam, { name: key });
        });
    });
};
const transformToArrayModelProperty = (metadata, key, type) => (Object.assign({}, metadata, { name: key, type: 'array', items: Object.assign({}, type) }));
exports.exploreModelDefinition = (type, definitions) => {
    const { prototype } = type;
    const modelProperties = exploreModelProperties(prototype);
    const propertiesWithType = modelProperties.map(key => {
        const metadata = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key) ||
            {};
        const defaultTypes = [String, Boolean, Number, Object, Array];
        if (shared_utils_1.isFunction(metadata.type) &&
            !defaultTypes.find(defaultType => defaultType === metadata.type)) {
            const nestedModelName = exports.exploreModelDefinition(metadata.type, definitions);
            const $ref = getDefinitionPath(nestedModelName);
            if (metadata.isArray) {
                return transformToArrayModelProperty(metadata, key, { $ref });
            }
            return Object.assign({}, metadata, { name: key, $ref });
        }
        const metatype = metadata.type && shared_utils_1.isFunction(metadata.type)
            ? metadata.type.name
            : metadata.type;
        const swaggerType = exports.mapTypesToSwaggerTypes(metatype);
        if (metadata.isArray) {
            return transformToArrayModelProperty(metadata, key, {
                type: swaggerType
            });
        }
        return Object.assign({}, metadata, { name: key, type: metadata.enum ? getEnumType(metadata.enum) : swaggerType });
    });
    const typeDefinition = {
        type: 'object',
        properties: lodash_1.mapValues(lodash_1.keyBy(propertiesWithType, 'name'), property => lodash_1.omit(property, ['name', 'isArray', 'required']))
    };
    const typeDefinitionRequiredFields = propertiesWithType
        .filter(property => property.required != false)
        .map(property => property.name);
    if (typeDefinitionRequiredFields.length > 0) {
        typeDefinition['required'] = typeDefinitionRequiredFields;
    }
    definitions.push({
        [type.name]: typeDefinition
    });
    return type.name;
};
const getEnumType = (values) => {
    const hasString = values.filter(lodash_1.isString).length > 0;
    return hasString ? 'string' : 'number';
};
const mapParamType = (key) => {
    const keyPair = key.split(':');
    switch (Number(keyPair[0])) {
        case route_paramtypes_enum_1.RouteParamtypes.BODY:
            return 'body';
        case route_paramtypes_enum_1.RouteParamtypes.PARAM:
            return 'path';
        case route_paramtypes_enum_1.RouteParamtypes.QUERY:
            return 'query';
        case route_paramtypes_enum_1.RouteParamtypes.HEADERS:
            return 'header';
        default:
            return DEFAULT_PARAM_TOKEN;
    }
};
const mapParametersTypes = parameters => parameters.map(param => {
    if (isBodyParameter(param)) {
        return param;
    }
    const { type } = param;
    const paramWithStringifiedType = lodash_1.pickBy(Object.assign({}, param, { type: type && shared_utils_1.isFunction(type)
            ? exports.mapTypesToSwaggerTypes(type.name)
            : exports.mapTypesToSwaggerTypes(type) }), lodash_1.negate(shared_utils_1.isUndefined));
    if (paramWithStringifiedType.isArray) {
        return Object.assign({}, paramWithStringifiedType, { type: 'array', items: {
                type: exports.mapTypesToSwaggerTypes(param.type)
            } });
    }
    return paramWithStringifiedType;
});
exports.mapTypesToSwaggerTypes = (type) => {
    if (!(type && type.charAt)) {
        return '';
    }
    return type.charAt(0).toLowerCase() + type.slice(1);
};
const getDefinitionPath = modelName => `#/definitions/${modelName}`;
const mapModelsToDefinitons = (parameters, definitions) => {
    return parameters.map(param => {
        if (!isBodyParameter(param)) {
            return param;
        }
        const modelName = exports.exploreModelDefinition(param.type, definitions);
        const name = param.name ? param.name : modelName;
        const schema = {
            $ref: getDefinitionPath(modelName)
        };
        if (param.isArray) {
            return Object.assign({}, param, { name, schema: {
                    type: 'array',
                    items: schema
                } });
        }
        return Object.assign({}, param, { name,
            schema });
    });
};

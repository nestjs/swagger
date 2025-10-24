"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiParametersMetadata = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const model_properties_accessor_1 = require("../services/model-properties-accessor");
const parameter_metadata_accessor_1 = require("../services/parameter-metadata-accessor");
const parameters_metadata_mapper_1 = require("../services/parameters-metadata-mapper");
const schema_object_factory_1 = require("../services/schema-object-factory");
const swagger_types_mapper_1 = require("../services/swagger-types-mapper");
const global_parameters_storage_1 = require("../storages/global-parameters.storage");
const parameterMetadataAccessor = new parameter_metadata_accessor_1.ParameterMetadataAccessor();
const modelPropertiesAccessor = new model_properties_accessor_1.ModelPropertiesAccessor();
const parametersMetadataMapper = new parameters_metadata_mapper_1.ParametersMetadataMapper(modelPropertiesAccessor);
const swaggerTypesMapper = new swagger_types_mapper_1.SwaggerTypesMapper();
const schemaObjectFactory = new schema_object_factory_1.SchemaObjectFactory(modelPropertiesAccessor, swaggerTypesMapper);
const exploreApiParametersMetadata = (schemas, instance, prototype, method) => {
    const explicitParameters = Reflect.getMetadata(constants_1.DECORATORS.API_PARAMETERS, method);
    const globalParameters = global_parameters_storage_1.GlobalParametersStorage.getAll();
    const parametersMetadata = parameterMetadataAccessor.explore(instance, prototype, method);
    const noExplicitAndGlobalMetadata = (0, lodash_1.isNil)(explicitParameters) && (0, lodash_1.isNil)(globalParameters);
    if (noExplicitAndGlobalMetadata && (0, lodash_1.isNil)(parametersMetadata)) {
        return undefined;
    }
    const reflectedParametersAsProperties = parametersMetadataMapper.transformModelToProperties(parametersMetadata || {});
    let properties = reflectedParametersAsProperties;
    if (!noExplicitAndGlobalMetadata) {
        const mergeImplicitAndExplicit = (item) => (0, lodash_1.assign)(item, (0, lodash_1.find)(explicitParameters, ['name', item.name]));
        properties = removeBodyMetadataIfExplicitExists(properties, explicitParameters);
        properties = (0, lodash_1.map)(properties, mergeImplicitAndExplicit);
        properties = (0, lodash_1.unionWith)(properties, explicitParameters, globalParameters, (arrVal, othVal) => {
            return arrVal.name === othVal.name && arrVal.in === othVal.in;
        });
    }
    const paramsWithDefinitions = schemaObjectFactory.createFromModel(properties, schemas);
    const parameters = swaggerTypesMapper.mapParamTypes(paramsWithDefinitions);
    return parameters ? { parameters } : undefined;
};
exports.exploreApiParametersMetadata = exploreApiParametersMetadata;
function removeBodyMetadataIfExplicitExists(properties, explicitParams) {
    const isBodyReflected = (0, lodash_1.some)(properties, (p) => p.in === 'body');
    const isBodyDefinedExplicitly = (0, lodash_1.some)(explicitParams, (p) => p.in === 'body');
    if (isBodyReflected && isBodyDefinedExplicitly) {
        return (0, lodash_1.omitBy)(properties, (p) => p.in === 'body');
    }
    return properties;
}

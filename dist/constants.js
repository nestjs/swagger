"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECORATORS = exports.DECORATORS_PREFIX = void 0;
exports.DECORATORS_PREFIX = 'swagger';
exports.DECORATORS = {
    API_OPERATION: `${exports.DECORATORS_PREFIX}/apiOperation`,
    API_RESPONSE: `${exports.DECORATORS_PREFIX}/apiResponse`,
    API_PRODUCES: `${exports.DECORATORS_PREFIX}/apiProduces`,
    API_CONSUMES: `${exports.DECORATORS_PREFIX}/apiConsumes`,
    API_TAGS: `${exports.DECORATORS_PREFIX}/apiUseTags`,
    API_CALLBACKS: `${exports.DECORATORS_PREFIX}/apiCallbacks`,
    API_PARAMETERS: `${exports.DECORATORS_PREFIX}/apiParameters`,
    API_HEADERS: `${exports.DECORATORS_PREFIX}/apiHeaders`,
    API_MODEL_PROPERTIES: `${exports.DECORATORS_PREFIX}/apiModelProperties`,
    API_MODEL_PROPERTIES_ARRAY: `${exports.DECORATORS_PREFIX}/apiModelPropertiesArray`,
    API_SECURITY: `${exports.DECORATORS_PREFIX}/apiSecurity`,
    API_EXCLUDE_ENDPOINT: `${exports.DECORATORS_PREFIX}/apiExcludeEndpoint`,
    API_INCLUDE_ENDPOINT: `${exports.DECORATORS_PREFIX}/apiIncludeEndpoint`,
    API_EXCLUDE_CONTROLLER: `${exports.DECORATORS_PREFIX}/apiExcludeController`,
    API_EXTRA_MODELS: `${exports.DECORATORS_PREFIX}/apiExtraModels`,
    API_EXTENSION: `${exports.DECORATORS_PREFIX}/apiExtension`,
    API_SCHEMA: `${exports.DECORATORS_PREFIX}/apiSchema`,
    API_DEFAULT_GETTER: `${exports.DECORATORS_PREFIX}/apiDefaultGetter`,
    API_LINK: `${exports.DECORATORS_PREFIX}/apiLink`
};

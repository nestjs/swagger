"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseObjectFactory = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const is_built_in_type_util_1 = require("../utils/is-built-in-type.util");
const mimetype_content_wrapper_1 = require("./mimetype-content-wrapper");
const model_properties_accessor_1 = require("./model-properties-accessor");
const response_object_mapper_1 = require("./response-object-mapper");
const schema_object_factory_1 = require("./schema-object-factory");
const swagger_types_mapper_1 = require("./swagger-types-mapper");
class ResponseObjectFactory {
    constructor() {
        this.mimetypeContentWrapper = new mimetype_content_wrapper_1.MimetypeContentWrapper();
        this.modelPropertiesAccessor = new model_properties_accessor_1.ModelPropertiesAccessor();
        this.swaggerTypesMapper = new swagger_types_mapper_1.SwaggerTypesMapper();
        this.schemaObjectFactory = new schema_object_factory_1.SchemaObjectFactory(this.modelPropertiesAccessor, this.swaggerTypesMapper);
        this.responseObjectMapper = new response_object_mapper_1.ResponseObjectMapper();
    }
    create(response, produces, schemas, factories) {
        var _a;
        const { type, isArray } = response;
        response = (0, lodash_1.omit)(response, ['isArray']);
        if (!type) {
            return this.responseObjectMapper.wrapSchemaWithContent(response, produces);
        }
        if ((0, is_built_in_type_util_1.isBuiltInType)(type)) {
            const typeName = type && (0, lodash_1.isFunction)(type) ? type.name : type;
            const swaggerType = this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName);
            const exampleKeys = ['example', 'examples'];
            if (isArray) {
                const content = this.mimetypeContentWrapper.wrap(produces, {
                    schema: {
                        type: 'array',
                        items: {
                            type: swaggerType
                        }
                    }
                });
                return Object.assign(Object.assign({}, (0, lodash_1.omit)(response, exampleKeys)), content);
            }
            const content = this.mimetypeContentWrapper.wrap(produces, {
                schema: {
                    type: swaggerType
                }
            });
            return Object.assign(Object.assign({}, (0, lodash_1.omit)(response, exampleKeys)), content);
        }
        const name = this.schemaObjectFactory.exploreModelSchema(type, schemas);
        if ((0, lodash_1.isFunction)(type) && type.prototype) {
            const { prototype } = type;
            const links = {};
            const properties = this.modelPropertiesAccessor.getModelProperties(prototype);
            const generateLink = (controllerPrototype, method, parameter, field) => {
                if (!factories) {
                    return;
                }
                const linkName = factories.linkName(controllerPrototype.constructor.name, method.name, field);
                links[linkName] = {
                    operationId: factories.operationId(controllerPrototype.constructor.name, method.name),
                    parameters: {
                        [parameter]: `$response.body#/${field}`
                    }
                };
            };
            for (const key of properties) {
                const metadata = (_a = Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key)) !== null && _a !== void 0 ? _a : {};
                if (!metadata.link) {
                    continue;
                }
                const linkedType = metadata.link();
                const linkedGetterInfo = Reflect.getMetadata(constants_1.DECORATORS.API_DEFAULT_GETTER, linkedType.prototype);
                if (!linkedGetterInfo) {
                    continue;
                }
                const { getter, parameter, prototype: controllerPrototype } = linkedGetterInfo;
                generateLink(controllerPrototype, getter, parameter, key);
            }
            const customLinks = Reflect.getMetadata(constants_1.DECORATORS.API_LINK, prototype);
            for (const customLink of customLinks !== null && customLinks !== void 0 ? customLinks : []) {
                const { method, parameter, field, prototype: controllerPrototype } = customLink;
                generateLink(controllerPrototype, method, parameter, field);
            }
            if (!(0, lodash_1.isEmpty)(links)) {
                response.links = Object.assign(links, response.links);
            }
        }
        if (isArray) {
            return this.responseObjectMapper.toArrayRefObject(response, name, produces);
        }
        return this.responseObjectMapper.toRefObject(response, name, produces);
    }
}
exports.ResponseObjectFactory = ResponseObjectFactory;

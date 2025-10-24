"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerTypesMapper = void 0;
const lodash_1 = require("lodash");
class SwaggerTypesMapper {
    constructor() {
        this.keysToRemove = [
            'isArray',
            'enum',
            'enumName',
            'enumSchema',
            '$ref',
            'selfRequired',
            ...this.getSchemaOptionsKeys()
        ];
    }
    mapParamTypes(parameters) {
        return parameters.map((param) => {
            if (this.hasSchemaDefinition(param) ||
                this.hasRawContentDefinition(param)) {
                if (Array.isArray(param.required) && 'schema' in param) {
                    param.schema.required = param.required;
                    delete param.required;
                }
                if ('selfRequired' in param) {
                    param.required = param.selfRequired;
                }
                return this.omitParamKeys(param);
            }
            const { type } = param;
            const typeName = type && (0, lodash_1.isFunction)(type)
                ? this.mapTypeToOpenAPIType(type.name)
                : this.mapTypeToOpenAPIType(type);
            const paramWithTypeMetadata = (0, lodash_1.omitBy)(Object.assign(Object.assign({}, param), { type: typeName }), lodash_1.isUndefined);
            if (this.isEnumArrayType(paramWithTypeMetadata)) {
                return this.mapEnumArrayType(paramWithTypeMetadata, this.keysToRemove);
            }
            else if (paramWithTypeMetadata.isArray) {
                return this.mapArrayType(paramWithTypeMetadata, this.keysToRemove);
            }
            return Object.assign(Object.assign({}, (0, lodash_1.omit)(param, this.keysToRemove)), { schema: (0, lodash_1.omitBy)(Object.assign(Object.assign(Object.assign({}, this.getSchemaOptions(param)), (param.schema || {})), { enum: paramWithTypeMetadata.enum, type: paramWithTypeMetadata.type, $ref: paramWithTypeMetadata.$ref }), lodash_1.isUndefined) });
        });
    }
    mapTypeToOpenAPIType(type) {
        if (!(type && type.charAt)) {
            return;
        }
        return type.charAt(0).toLowerCase() + type.slice(1);
    }
    mapEnumArrayType(param, keysToRemove) {
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(param, keysToRemove)), { schema: Object.assign(Object.assign({}, this.getSchemaOptions(param)), { type: 'array', items: param.items }) });
    }
    mapArrayType(param, keysToRemove) {
        const itemsModifierKeys = ['format', 'maximum', 'minimum', 'pattern'];
        const items = param.items ||
            (0, lodash_1.omitBy)(Object.assign(Object.assign({}, (param.schema || {})), { enum: param.enum, type: this.mapTypeToOpenAPIType(param.type) }), lodash_1.isUndefined);
        const modifierProperties = (0, lodash_1.pick)(param, itemsModifierKeys);
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(param, keysToRemove)), { schema: Object.assign(Object.assign({}, (0, lodash_1.omit)(this.getSchemaOptions(param), [...itemsModifierKeys])), { type: 'array', items: (0, lodash_1.isString)(items.type)
                    ? Object.assign({ type: items.type }, modifierProperties) : Object.assign(Object.assign({}, items.type), modifierProperties) }) });
    }
    getSchemaOptionsKeys() {
        return [
            'properties',
            'patternProperties',
            'additionalProperties',
            'minimum',
            'maximum',
            'maxProperties',
            'minItems',
            'minProperties',
            'maxItems',
            'minLength',
            'maxLength',
            'exclusiveMaximum',
            'exclusiveMinimum',
            'uniqueItems',
            'title',
            'format',
            'pattern',
            'nullable',
            'default',
            'example',
            'oneOf',
            'anyOf',
            'type',
            'items'
        ];
    }
    getSchemaOptions(param) {
        const schemaKeys = this.getSchemaOptionsKeys();
        const optionsObject = schemaKeys.reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: param[key] })), {});
        return (0, lodash_1.omitBy)(optionsObject, lodash_1.isUndefined);
    }
    isEnumArrayType(param) {
        return param.isArray && param.items && param.items.enum;
    }
    hasSchemaDefinition(param) {
        return !!param.schema;
    }
    hasRawContentDefinition(param) {
        return 'content' in param;
    }
    omitParamKeys(param) {
        return (0, lodash_1.omit)(param, this.keysToRemove);
    }
}
exports.SwaggerTypesMapper = SwaggerTypesMapper;

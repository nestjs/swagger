"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaObjectFactory = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lodash_1 = require("lodash");
const constants_1 = require("../constants");
const helpers_1 = require("../decorators/helpers");
const api_extra_models_explorer_1 = require("../explorers/api-extra-models.explorer");
const utils_1 = require("../utils");
const enum_utils_1 = require("../utils/enum.utils");
const is_body_parameter_util_1 = require("../utils/is-body-parameter.util");
const is_built_in_type_util_1 = require("../utils/is-built-in-type.util");
const is_date_ctor_util_1 = require("../utils/is-date-ctor.util");
class SchemaObjectFactory {
    constructor(modelPropertiesAccessor, swaggerTypesMapper) {
        this.modelPropertiesAccessor = modelPropertiesAccessor;
        this.swaggerTypesMapper = swaggerTypesMapper;
    }
    createFromModel(parameters, schemas) {
        const parameterObjects = parameters.map((param) => {
            if (this.isLazyTypeFunc(param.type)) {
                [param.type, param.isArray] = (0, helpers_1.getTypeIsArrayTuple)(param.type(), undefined);
            }
            if (!(0, is_body_parameter_util_1.isBodyParameter)(param) && param.enumName) {
                return this.createEnumParam(param, schemas);
            }
            if (this.isPrimitiveType(param.type)) {
                return param;
            }
            if (this.isArrayCtor(param.type)) {
                return this.mapArrayCtorParam(param);
            }
            if (!(0, is_body_parameter_util_1.isBodyParameter)(param)) {
                return this.createQueryOrParamSchema(param, schemas);
            }
            return this.getCustomType(param, schemas);
        });
        return (0, lodash_1.flatten)(parameterObjects);
    }
    getCustomType(param, schemas) {
        const modelName = this.exploreModelSchema(param.type, schemas);
        const name = param.name || modelName;
        const schema = Object.assign(Object.assign({}, (param.schema || {})), { $ref: (0, utils_1.getSchemaPath)(modelName) });
        const isArray = param.isArray;
        param = (0, lodash_1.omit)(param, 'isArray');
        if (isArray) {
            return Object.assign(Object.assign({}, param), { name, schema: {
                    type: 'array',
                    items: schema
                } });
        }
        return Object.assign(Object.assign({}, param), { name,
            schema });
    }
    createQueryOrParamSchema(param, schemas) {
        if ((0, is_date_ctor_util_1.isDateCtor)(param.type)) {
            return Object.assign(Object.assign({ format: 'date-time' }, param), { type: 'string' });
        }
        if (this.isBigInt(param.type)) {
            return Object.assign(Object.assign({ format: 'int64' }, param), { type: 'integer' });
        }
        if ((0, lodash_1.isFunction)(param.type)) {
            if (param.name) {
                return this.getCustomType(param, schemas);
            }
            const propertiesWithType = this.extractPropertiesFromType(param.type, schemas);
            if (!propertiesWithType) {
                return param;
            }
            return propertiesWithType.map((property) => {
                const keysToOmit = [
                    'isArray',
                    'enumName',
                    'enumSchema',
                    'selfRequired'
                ];
                const parameterObject = Object.assign(Object.assign({}, (0, lodash_1.omit)(property, keysToOmit)), { in: 'query', required: 'selfRequired' in property
                        ? property.selfRequired
                        : typeof property.required === 'boolean'
                            ? property.required
                            : true });
                const keysToMoveToSchema = [
                    ...this.swaggerTypesMapper.getSchemaOptionsKeys(),
                    'allOf'
                ];
                return keysToMoveToSchema.reduce((acc, key) => {
                    if (key in property) {
                        acc.schema = Object.assign(Object.assign({}, acc.schema), { [key]: property[key] });
                        delete acc[key];
                    }
                    return acc;
                }, parameterObject);
            });
        }
        if (this.isObjectLiteral(param.type)) {
            const schemaFromObjectLiteral = this.createFromObjectLiteral(param.name, param.type, schemas);
            if (param.isArray) {
                return Object.assign(Object.assign({}, param), { schema: {
                        type: 'array',
                        items: (0, lodash_1.omit)(schemaFromObjectLiteral, 'name')
                    }, selfRequired: param.required });
            }
            return Object.assign(Object.assign({}, param), { schema: {
                    type: schemaFromObjectLiteral.type,
                    properties: schemaFromObjectLiteral.properties,
                    required: schemaFromObjectLiteral.required
                }, selfRequired: param.required });
        }
        return param;
    }
    extractPropertiesFromType(type, schemas, pendingSchemasRefs = []) {
        const { prototype } = type;
        if (!prototype) {
            return;
        }
        const extraModels = (0, api_extra_models_explorer_1.exploreGlobalApiExtraModelsMetadata)(type);
        extraModels.forEach((item) => this.exploreModelSchema(item, schemas, pendingSchemasRefs));
        this.modelPropertiesAccessor.applyMetadataFactory(prototype);
        const modelProperties = this.modelPropertiesAccessor.getModelProperties(prototype);
        const propertiesWithType = modelProperties.map((key) => {
            const property = this.mergePropertyWithMetadata(key, prototype, schemas, pendingSchemasRefs);
            const schemaCombinators = ['oneOf', 'anyOf', 'allOf'];
            const declaredSchemaCombinator = schemaCombinators.find((combinator) => combinator in property);
            if (declaredSchemaCombinator) {
                const schemaObjectMetadata = property;
                if ((schemaObjectMetadata === null || schemaObjectMetadata === void 0 ? void 0 : schemaObjectMetadata.type) === 'array' ||
                    schemaObjectMetadata.isArray) {
                    schemaObjectMetadata.items = {};
                    schemaObjectMetadata.items[declaredSchemaCombinator] =
                        property[declaredSchemaCombinator];
                    delete property[declaredSchemaCombinator];
                }
                else {
                    delete schemaObjectMetadata.type;
                }
            }
            return property;
        });
        return propertiesWithType;
    }
    exploreModelSchema(type, schemas, pendingSchemasRefs = []) {
        if (this.isLazyTypeFunc(type)) {
            type = type();
        }
        const propertiesWithType = this.extractPropertiesFromType(type, schemas, pendingSchemasRefs);
        if (!propertiesWithType) {
            return '';
        }
        const extensionProperties = Reflect.getMetadata(constants_1.DECORATORS.API_EXTENSION, type) || {};
        const { schemaName, schemaProperties } = this.getSchemaMetadata(type);
        const typeDefinition = Object.assign(Object.assign({ type: 'object', properties: (0, lodash_1.mapValues)((0, lodash_1.keyBy)(propertiesWithType, 'name'), (property) => {
                const keysToOmit = [
                    'name',
                    'isArray',
                    'enumName',
                    'enumSchema',
                    'selfRequired'
                ];
                if ('required' in property && Array.isArray(property.required)) {
                    return (0, lodash_1.omit)(property, keysToOmit);
                }
                return (0, lodash_1.omit)(property, [...keysToOmit, 'required']);
            }) }, extensionProperties), schemaProperties);
        const typeDefinitionRequiredFields = propertiesWithType
            .filter((property) => 'selfRequired' in property
            ? property.selfRequired != false
            : property.required != false && !Array.isArray(property.required))
            .map((property) => property.name);
        if (typeDefinitionRequiredFields.length > 0) {
            typeDefinition['required'] = typeDefinitionRequiredFields;
        }
        if (schemas[schemaName] && !(0, lodash_1.isEqual)(schemas[schemaName], typeDefinition)) {
            common_1.Logger.error(`Duplicate DTO detected: "${schemaName}" is defined multiple times with different schemas.\n` +
                `Consider using unique class names or applying @ApiExtraModels() decorator with custom schema names.\n` +
                `Note: This will throw an error in the next major version.`);
        }
        schemas[schemaName] = typeDefinition;
        return schemaName;
    }
    getSchemaMetadata(type) {
        var _a, _b;
        const schemas = (_a = Reflect.getOwnMetadata(constants_1.DECORATORS.API_SCHEMA, type)) !== null && _a !== void 0 ? _a : [];
        const _c = (_b = schemas[schemas.length - 1]) !== null && _b !== void 0 ? _b : {}, { name } = _c, schemaProperties = __rest(_c, ["name"]);
        return { schemaName: name !== null && name !== void 0 ? name : type.name, schemaProperties };
    }
    mergePropertyWithMetadata(key, prototype, schemas, pendingSchemaRefs, metadata) {
        if (!metadata) {
            metadata =
                (0, lodash_1.omit)(Reflect.getMetadata(constants_1.DECORATORS.API_MODEL_PROPERTIES, prototype, key), 'link') || {};
        }
        if (this.isLazyTypeFunc(metadata.type)) {
            metadata.type = metadata.type();
            [metadata.type, metadata.isArray] = (0, helpers_1.getTypeIsArrayTuple)(metadata.type, metadata.isArray);
        }
        if (Array.isArray(metadata.type)) {
            return this.createFromNestedArray(key, metadata, schemas, pendingSchemaRefs);
        }
        return this.createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs);
    }
    createEnumParam(param, schemas) {
        var _a, _b, _c, _d, _e;
        const enumName = param.enumName;
        const $ref = (0, utils_1.getSchemaPath)(enumName);
        if (!(enumName in schemas)) {
            const _enum = param.enum
                ? param.enum
                : param.schema
                    ? param.schema['items']
                        ? param.schema['items']['enum']
                        : param.schema['enum']
                    : param.isArray && param.items
                        ? param.items.enum
                        : undefined;
            schemas[enumName] = Object.assign(Object.assign({ type: (_d = (param.isArray
                    ? (_b = (_a = param.schema) === null || _a === void 0 ? void 0 : _a['items']) === null || _b === void 0 ? void 0 : _b['type']
                    : (_c = param.schema) === null || _c === void 0 ? void 0 : _c['type'])) !== null && _d !== void 0 ? _d : 'string', enum: _enum }, param.enumSchema), (param['x-enumNames'] ? { 'x-enumNames': param['x-enumNames'] } : {}));
        }
        else {
            if (param.enumSchema) {
                schemas[enumName] = Object.assign(Object.assign({}, schemas[enumName]), param.enumSchema);
            }
        }
        param.schema =
            param.isArray || ((_e = param.schema) === null || _e === void 0 ? void 0 : _e['items'])
                ? { type: 'array', items: { $ref } }
                : { $ref };
        return (0, lodash_1.omit)(param, [
            'isArray',
            'items',
            'enumName',
            'enum',
            'x-enumNames',
            'enumSchema'
        ]);
    }
    createEnumSchemaType(key, metadata, schemas) {
        var _a, _b, _c;
        if (!('enumName' in metadata) || !metadata.enumName) {
            return Object.assign(Object.assign({}, metadata), { name: metadata.name || key });
        }
        const enumName = metadata.enumName;
        const $ref = (0, utils_1.getSchemaPath)(enumName);
        const enumType = (_a = (metadata.isArray ? metadata.items['type'] : metadata.type)) !== null && _a !== void 0 ? _a : 'string';
        if (!schemas[enumName]) {
            schemas[enumName] = Object.assign(Object.assign({ type: enumType }, metadata.enumSchema), { enum: metadata.isArray && metadata.items
                    ? metadata.items['enum']
                    : metadata.enum, description: (_b = metadata.description) !== null && _b !== void 0 ? _b : undefined, 'x-enumNames': (_c = metadata['x-enumNames']) !== null && _c !== void 0 ? _c : undefined });
        }
        else {
            if (metadata.enumSchema) {
                schemas[enumName] = Object.assign(Object.assign({}, schemas[enumName]), metadata.enumSchema);
            }
            if (metadata['x-enumNames']) {
                schemas[enumName]['x-enumNames'] = metadata['x-enumNames'];
            }
        }
        const _schemaObject = Object.assign(Object.assign({}, metadata), { name: metadata.name || key, type: metadata.isArray ? 'array' : 'string' });
        const refHost = metadata.isArray
            ? { items: { $ref } }
            : { allOf: [{ $ref }] };
        const paramObject = Object.assign(Object.assign({}, _schemaObject), refHost);
        const pathsToOmit = ['enum', 'enumName', 'enumSchema', 'x-enumNames'];
        if (!metadata.isArray) {
            pathsToOmit.push('type');
        }
        return (0, lodash_1.omit)(paramObject, pathsToOmit);
    }
    createNotBuiltInTypeReference(key, metadata, trueMetadataType, schemas, pendingSchemaRefs) {
        if ((0, shared_utils_1.isUndefined)(trueMetadataType)) {
            throw new Error(`A circular dependency has been detected (property key: "${key}"). Please, make sure that each side of a bidirectional relationships are using lazy resolvers ("type: () => ClassType").`);
        }
        let { schemaName: schemaObjectName } = this.getSchemaMetadata(trueMetadataType);
        if (!(schemaObjectName in schemas) &&
            !pendingSchemaRefs.includes(schemaObjectName)) {
            schemaObjectName = this.exploreModelSchema(trueMetadataType, schemas, [...pendingSchemaRefs, schemaObjectName]);
        }
        const $ref = (0, utils_1.getSchemaPath)(schemaObjectName);
        if (metadata.isArray) {
            return this.transformToArraySchemaProperty(metadata, key, { $ref });
        }
        const keysToRemove = ['type', 'isArray', 'required', 'name'];
        const validMetadataObject = (0, lodash_1.omit)(metadata, keysToRemove);
        const extraMetadataKeys = Object.keys(validMetadataObject);
        if (extraMetadataKeys.length > 0) {
            return Object.assign(Object.assign({ name: metadata.name || key, required: metadata.required }, validMetadataObject), { allOf: [{ $ref }] });
        }
        return {
            name: metadata.name || key,
            required: metadata.required,
            $ref
        };
    }
    transformToArraySchemaProperty(metadata, key, type) {
        const keysToRemove = ['type', 'enum'];
        const [movedProperties, keysToMove] = this.extractPropertyModifiers(metadata);
        const schemaHost = Object.assign(Object.assign({}, (0, lodash_1.omit)(metadata, [...keysToRemove, ...keysToMove])), { name: metadata.name || key, type: 'array', items: (0, lodash_1.isString)(type)
                ? Object.assign({ type }, movedProperties) : Object.assign(Object.assign({}, type), movedProperties) });
        schemaHost.items = (0, lodash_1.omitBy)(schemaHost.items, shared_utils_1.isUndefined);
        return schemaHost;
    }
    mapArrayCtorParam(param) {
        return Object.assign(Object.assign({}, (0, lodash_1.omit)(param, 'type')), { schema: {
                type: 'array',
                items: {
                    type: 'string'
                }
            } });
    }
    createFromObjectLiteral(key, literalObj, schemas) {
        const objLiteralKeys = Object.keys(literalObj);
        const properties = {};
        const required = [];
        objLiteralKeys.forEach((key) => {
            const propertyCompilerMetadata = literalObj[key];
            if ((0, enum_utils_1.isEnumArray)(propertyCompilerMetadata)) {
                propertyCompilerMetadata.type = 'array';
                const enumValues = (0, enum_utils_1.getEnumValues)(propertyCompilerMetadata.enum);
                propertyCompilerMetadata.items = {
                    type: (0, enum_utils_1.getEnumType)(enumValues),
                    enum: enumValues
                };
                delete propertyCompilerMetadata.enum;
            }
            else if (propertyCompilerMetadata.enum) {
                const enumValues = (0, enum_utils_1.getEnumValues)(propertyCompilerMetadata.enum);
                propertyCompilerMetadata.enum = enumValues;
                propertyCompilerMetadata.type = (0, enum_utils_1.getEnumType)(enumValues);
            }
            const propertyMetadata = this.mergePropertyWithMetadata(key, Object, schemas, [], propertyCompilerMetadata);
            if ('required' in propertyMetadata && propertyMetadata.required) {
                required.push(key);
            }
            const keysToRemove = ['isArray', 'name', 'required'];
            const validMetadataObject = (0, lodash_1.omit)(propertyMetadata, keysToRemove);
            properties[key] = validMetadataObject;
        });
        const schema = {
            name: key,
            type: 'object',
            properties,
            required
        };
        return schema;
    }
    createFromNestedArray(key, metadata, schemas, pendingSchemaRefs) {
        const recurse = (type) => {
            if (!Array.isArray(type)) {
                const schemaMetadata = this.createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs, type);
                return (0, lodash_1.omit)(schemaMetadata, ['isArray', 'name']);
            }
            return {
                name: key,
                type: 'array',
                items: recurse(type[0])
            };
        };
        return recurse(metadata.type);
    }
    createSchemaMetadata(key, metadata, schemas, pendingSchemaRefs, nestedArrayType) {
        const typeRef = nestedArrayType || metadata.type;
        if (this.isObjectLiteral(typeRef)) {
            const schemaFromObjectLiteral = this.createFromObjectLiteral(key, typeRef, schemas);
            if (metadata.isArray) {
                return {
                    name: schemaFromObjectLiteral.name,
                    type: 'array',
                    items: (0, lodash_1.omit)(schemaFromObjectLiteral, 'name'),
                    selfRequired: metadata.required
                };
            }
            return Object.assign(Object.assign({}, schemaFromObjectLiteral), { selfRequired: metadata.required });
        }
        if ((0, lodash_1.isString)(typeRef)) {
            if ((0, enum_utils_1.isEnumMetadata)(metadata)) {
                return this.createEnumSchemaType(key, metadata, schemas);
            }
            if (metadata.isArray) {
                return this.transformToArraySchemaProperty(metadata, key, typeRef);
            }
            return Object.assign(Object.assign({}, metadata), { name: metadata.name || key });
        }
        if ((0, is_date_ctor_util_1.isDateCtor)(typeRef)) {
            if (metadata.isArray) {
                return this.transformToArraySchemaProperty(metadata, key, {
                    format: metadata.format || 'date-time',
                    type: 'string'
                });
            }
            return Object.assign(Object.assign({ format: 'date-time' }, metadata), { type: 'string', name: metadata.name || key });
        }
        if (this.isBigInt(typeRef)) {
            return Object.assign(Object.assign({ format: 'int64' }, metadata), { type: 'integer', name: metadata.name || key });
        }
        if (!(0, is_built_in_type_util_1.isBuiltInType)(typeRef)) {
            return this.createNotBuiltInTypeReference(key, metadata, typeRef, schemas, pendingSchemaRefs);
        }
        const typeName = this.getTypeName(typeRef);
        const itemType = this.swaggerTypesMapper.mapTypeToOpenAPIType(typeName);
        if (metadata.isArray) {
            return this.transformToArraySchemaProperty(metadata, key, {
                type: itemType
            });
        }
        else if (itemType === 'array') {
            const defaultOnArray = 'string';
            const hasSchemaCombinator = ['oneOf', 'anyOf', 'allOf'].some((combinator) => combinator in metadata);
            if (hasSchemaCombinator) {
                return Object.assign(Object.assign({}, metadata), { type: undefined, name: metadata.name || key });
            }
            return this.transformToArraySchemaProperty(metadata, key, {
                type: defaultOnArray
            });
        }
        return Object.assign(Object.assign({}, metadata), { name: metadata.name || key, type: itemType });
    }
    isArrayCtor(type) {
        return type === Array;
    }
    isPrimitiveType(type) {
        return ((0, lodash_1.isFunction)(type) &&
            [String, Boolean, Number].some((item) => item === type));
    }
    isLazyTypeFunc(type) {
        return (0, lodash_1.isFunction)(type) && type.name == 'type';
    }
    getTypeName(type) {
        return type && (0, lodash_1.isFunction)(type) ? type.name : type;
    }
    isObjectLiteral(obj) {
        if (typeof obj !== 'object' || !obj) {
            return false;
        }
        const hasOwnProp = Object.prototype.hasOwnProperty;
        let objPrototype = obj;
        while (Object.getPrototypeOf((objPrototype = Object.getPrototypeOf(objPrototype))) !== null)
            ;
        for (const prop in obj) {
            if (!hasOwnProp.call(obj, prop) && !hasOwnProp.call(objPrototype, prop)) {
                return false;
            }
        }
        return Object.getPrototypeOf(obj) === objPrototype;
    }
    isBigInt(type) {
        return type === BigInt;
    }
    extractPropertyModifiers(metadata) {
        const modifierKeys = [
            'format',
            'maximum',
            'maxLength',
            'minimum',
            'minLength',
            'pattern'
        ];
        return [(0, lodash_1.pick)(metadata, modifierKeys), modifierKeys];
    }
}
exports.SchemaObjectFactory = SchemaObjectFactory;

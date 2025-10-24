"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnumMetadata = exports.isEnumDefined = exports.isEnumArray = void 0;
exports.getEnumValues = getEnumValues;
exports.getEnumType = getEnumType;
exports.addEnumArraySchema = addEnumArraySchema;
exports.addEnumSchema = addEnumSchema;
const lodash_1 = require("lodash");
function getEnumValues(enumType) {
    if (typeof enumType === 'function') {
        return getEnumValues(enumType());
    }
    if (Array.isArray(enumType)) {
        return enumType;
    }
    if (typeof enumType !== 'object') {
        return [];
    }
    const numericValues = Object.values(enumType)
        .filter((value) => typeof value === 'number')
        .map((value) => value.toString());
    return Object.keys(enumType)
        .filter((key) => !numericValues.includes(key))
        .map((key) => enumType[key]);
}
function getEnumType(values) {
    const hasString = values.filter(lodash_1.isString).length > 0;
    return hasString ? 'string' : 'number';
}
function addEnumArraySchema(paramDefinition, decoratorOptions) {
    const paramSchema = paramDefinition.schema || {};
    paramDefinition.schema = paramSchema;
    paramSchema.type = 'array';
    delete paramDefinition.isArray;
    const enumValues = getEnumValues(decoratorOptions.enum);
    paramSchema.items = {
        type: getEnumType(enumValues),
        enum: enumValues
    };
    if (decoratorOptions.enumName) {
        paramDefinition.enumName = decoratorOptions.enumName;
    }
    if (decoratorOptions.enumSchema) {
        paramDefinition.enumSchema = decoratorOptions.enumSchema;
    }
}
function addEnumSchema(paramDefinition, decoratorOptions) {
    const paramSchema = paramDefinition.schema || {};
    const enumValues = getEnumValues(decoratorOptions.enum);
    paramDefinition.schema = paramSchema;
    paramSchema.enum = enumValues;
    paramSchema.type = getEnumType(enumValues);
    if (decoratorOptions.enumName) {
        paramDefinition.enumName = decoratorOptions.enumName;
    }
    if (decoratorOptions.enumSchema) {
        paramDefinition.enumSchema = decoratorOptions.enumSchema;
    }
}
const isEnumArray = (obj) => obj.isArray && obj.enum;
exports.isEnumArray = isEnumArray;
const isEnumDefined = (obj) => obj.enum;
exports.isEnumDefined = isEnumDefined;
const isEnumMetadata = (metadata) => { var _a; return metadata.enum || (metadata.isArray && ((_a = metadata.items) === null || _a === void 0 ? void 0 : _a['enum'])); };
exports.isEnumMetadata = isEnumMetadata;

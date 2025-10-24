"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoratorsProperties = exports.decoratorsPropertiesMappingType = void 0;
var decoratorsPropertiesMappingType;
(function (decoratorsPropertiesMappingType) {
    decoratorsPropertiesMappingType[decoratorsPropertiesMappingType["DIRECT"] = 0] = "DIRECT";
    decoratorsPropertiesMappingType[decoratorsPropertiesMappingType["INDIRECT_VALUE"] = 1] = "INDIRECT_VALUE";
    decoratorsPropertiesMappingType[decoratorsPropertiesMappingType["INDIRECT_ARGUMENT"] = 2] = "INDIRECT_ARGUMENT";
})(decoratorsPropertiesMappingType || (exports.decoratorsPropertiesMappingType = decoratorsPropertiesMappingType = {}));
exports.decoratorsProperties = [
    {
        mappingType: decoratorsPropertiesMappingType.DIRECT,
        decorator: 'Min',
        property: 'minimum',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.DIRECT,
        decorator: 'Max',
        property: 'maximum',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.DIRECT,
        decorator: 'MinLength',
        property: 'minLength',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.DIRECT,
        decorator: 'MaxLength',
        property: 'maxLength',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'ArrayNotEmpty',
        property: 'minItems',
        value: 1
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsPositive',
        property: 'minimum',
        value: 1
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsNegative',
        property: 'maximum',
        value: -1
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'ArrayUnique',
        property: 'uniqueItems',
        value: true
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsBase64',
        property: 'format',
        value: 'base64'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsCreditCard',
        property: 'format',
        value: 'credit-card'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsCurrency',
        property: 'format',
        value: 'currency'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsEmail',
        property: 'format',
        value: 'email'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsJSON',
        property: 'format',
        value: 'json'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsUrl',
        property: 'format',
        value: 'uri'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsUUID',
        property: 'format',
        value: 'uuid'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsMobilePhone',
        property: 'format',
        value: 'mobile-phone'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsAscii',
        property: 'pattern',
        value: '^[\\x00-\\x7F]+$'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsHexColor',
        property: 'pattern',
        value: '^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_VALUE,
        decorator: 'IsHexadecimal',
        property: 'pattern',
        value: '^(0x|0h)?[0-9A-F]+$'
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_ARGUMENT,
        decorator: 'ArrayMinSize',
        property: 'minItems',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_ARGUMENT,
        decorator: 'ArrayMaxSize',
        property: 'maxItems',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_ARGUMENT,
        decorator: 'IsDivisibleBy',
        property: 'multipleOf',
        value: undefined
    },
    {
        mappingType: decoratorsPropertiesMappingType.INDIRECT_ARGUMENT,
        decorator: 'Contains',
        property: 'pattern',
        value: undefined
    }
];

export declare enum decoratorsPropertiesMappingType {
    DIRECT = 0,
    INDIRECT_VALUE = 1,
    INDIRECT_ARGUMENT = 2
}
export declare const decoratorsProperties: ({
    mappingType: decoratorsPropertiesMappingType;
    decorator: string;
    property: string;
    value: number;
} | {
    mappingType: decoratorsPropertiesMappingType;
    decorator: string;
    property: string;
    value: boolean;
} | {
    mappingType: decoratorsPropertiesMappingType;
    decorator: string;
    property: string;
    value: string;
})[];

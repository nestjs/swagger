export const recordDtoText = `
export class RecordDto {
    @ApiProperty()
    stringMap: Record<string, string>;
    @ApiProperty()
    numberMap: Record<string, number>;
    @ApiProperty()
    booleanMap: Record<string, boolean>;
    @ApiProperty()
    anyMap: Record<string, any>;
    @ApiProperty()
    indexSignature: { [key: string]: string };
    @ApiProperty()
    arrayMap: Record<string, string[]>;
    @ApiProperty()
    nestedMap: Record<string, Record<string, string>>;
    @ApiProperty()
    nullableMap: Record<string, string> | null;
    @ApiProperty()
    optionalMap?: Record<string, string>;
}
`;

export const recordDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
export class RecordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stringMap: { required: true, type: "object", additionalProperties: { type: "string" } }, numberMap: { required: true, type: "object", additionalProperties: { type: "number" } }, booleanMap: { required: true, type: "object", additionalProperties: { type: "boolean" } }, anyMap: { required: true, type: "object", additionalProperties: true }, indexSignature: { required: true, type: "object", additionalProperties: { type: "string" } }, arrayMap: { required: true, type: "object", additionalProperties: { type: "array", items: { type: "string" } } }, nestedMap: { required: true, type: "object", additionalProperties: { type: "object", additionalProperties: { type: "string" } } }, nullableMap: { required: true, type: "object", additionalProperties: { type: "string" }, nullable: true }, optionalMap: { required: false, type: "object", additionalProperties: { type: "string" } } };
    }
}
__decorate([
    ApiProperty()
], RecordDto.prototype, "stringMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "numberMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "booleanMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "anyMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "indexSignature", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "arrayMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "nestedMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "nullableMap", void 0);
__decorate([
    ApiProperty()
], RecordDto.prototype, "optionalMap", void 0);
`;

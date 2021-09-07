export const nullableDtoText = `
enum Status {
    ENABLED,
    DISABLED
}

export class NullableDto {
  @ApiProperty()
  stringValue: string | null;
  @ApiProperty()
  stringArr: string[] | null;
  @ApiProperty()
  enumValue: Status | null;
  @ApiProperty()
  optionalString?: string;
  @ApiProperty()
  undefinedString: string | undefined;
}
`;

export const nullableDtoTextTranspiled = `var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
export class NullableDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stringValue: { required: true, type: () => String, nullable: true }, stringArr: { required: true, type: () => [String], nullable: true }, enumValue: { required: true, nullable: true, enum: Status }, optionalString: { required: false, type: () => String }, undefinedString: { required: true, type: () => String } };
    }
}
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringArr", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "enumValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "optionalString", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "undefinedString", void 0);
`;

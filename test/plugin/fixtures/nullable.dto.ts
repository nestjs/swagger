export const nullableDtoText = `
enum OneValueEnum {
    ONE
}

export class NullableDto {
  @ApiProperty()
  stringValue: string | null;
  @ApiProperty()
  stringArr: string[] | null;
  @ApiProperty()
  optionalString?: string;
  @ApiProperty()
  undefinedString: string | undefined;
  @ApiProperty()
  nullableEnumValue: OneValueEnum | null;
  @ApiProperty()
  optionalEnumValue?: OneValueEnum;
  @ApiProperty()
  undefinedEnumValue: OneValueEnum | undefined;
}
`;

export const nullableDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
var OneValueEnum;
(function (OneValueEnum) {
    OneValueEnum[OneValueEnum["ONE"] = 0] = "ONE";
})(OneValueEnum || (OneValueEnum = {}));
export class NullableDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stringValue: { required: true, type: () => String, nullable: true }, stringArr: { required: true, type: () => [String], nullable: true }, optionalString: { required: false, type: () => String }, undefinedString: { required: true, type: () => String }, nullableEnumValue: { required: true, nullable: true, enum: OneValueEnum }, optionalEnumValue: { required: false, enum: OneValueEnum }, undefinedEnumValue: { required: true, enum: OneValueEnum } };
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
], NullableDto.prototype, "optionalString", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "undefinedString", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "nullableEnumValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "optionalEnumValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "undefinedEnumValue", void 0);
`;

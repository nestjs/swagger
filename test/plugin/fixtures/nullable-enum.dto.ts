export const nullableEnumDtoText = `
enum EnumValues {
    enum_a = 'a',
    enum_b = 'b',
    enum_c = 'c'
}

export class NullableEnumDto {
  @ApiProperty()
  enumValue: EnumValues | null;
  @ApiProperty()
  enumArr: EnumValues[] | null;
  @ApiProperty()
  optionalEnum?: EnumValues;
  @ApiProperty()
  undefinedEnum: EnumValues | undefined;
}
`;

export const nullableEnumDtoTextTranspiled = `import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
const openapi = __require("@nestjs/swagger");
var EnumValues;
(function (EnumValues) {
    EnumValues["enum_a"] = "a";
    EnumValues["enum_b"] = "b";
    EnumValues["enum_c"] = "c";
})(EnumValues || (EnumValues = {}));
export class NullableEnumDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { enumValue: { required: true, nullable: true, enum: EnumValues }, enumArr: { required: true, nullable: true, enum: EnumValues }, optionalEnum: { required: false, enum: EnumValues }, undefinedEnum: { required: true, enum: EnumValues } };
    }
}
__decorate([
    ApiProperty()
], NullableEnumDto.prototype, "enumValue", void 0);
__decorate([
    ApiProperty()
], NullableEnumDto.prototype, "enumArr", void 0);
__decorate([
    ApiProperty()
], NullableEnumDto.prototype, "optionalEnum", void 0);
__decorate([
    ApiProperty()
], NullableEnumDto.prototype, "undefinedEnum", void 0);
`;

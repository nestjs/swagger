export const nullableDtoText = `
export class NullableDto {
  @ApiProperty()
  stringValue: string | null;
  @ApiProperty()
  stringArr: string[] | null;
  @ApiProperty()
  optionalString?: string;
  @ApiProperty()
  undefinedString: string | undefined;
}
`;

export const nullableDtoTextTranspiled = `import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
const openapi = __require("@nestjs/swagger");
export class NullableDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stringValue: { required: true, type: () => String, nullable: true }, stringArr: { required: true, type: () => [String], nullable: true }, optionalString: { required: false, type: () => String }, undefinedString: { required: true, type: () => String } };
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
`;

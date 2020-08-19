export const nullableDtoText = `
export class NullableDto {
  @ApiProperty()
  stringValue: string | null;
  @ApiProperty()
  stringArr: string[] | null;
}
`;

export const nullableDtoTextTranspiled = `export class NullableDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { stringValue: { required: true, type: () => String, nullable: true }, stringArr: { required: true, type: () => [String], nullable: true } };
    }
}
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringArr", void 0);
`;

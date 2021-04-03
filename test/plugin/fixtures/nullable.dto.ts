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
        return { stringValue: { required: true, nullable: true, type: () => String }, stringArr: { required: true, nullable: true, type: () => [String] } };
    }
}
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringValue", void 0);
__decorate([
    ApiProperty()
], NullableDto.prototype, "stringArr", void 0);
`;

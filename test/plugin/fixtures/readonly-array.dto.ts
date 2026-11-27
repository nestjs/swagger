export const readonlyArrayDtoText = `
export class ReadonlyArrayDto {
    @ApiProperty()
    names: readonly string[];
    @ApiProperty()
    ids: ReadonlyArray<number>;
    @ApiProperty()
    nested?: readonly (readonly string[])[];
}
`;

export const readonlyArrayDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
export class ReadonlyArrayDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { names: { required: true, type: () => [String] }, ids: { required: true, type: () => [Number] }, nested: { required: false, type: () => [[String]] } };
    }
}
__decorate([
    ApiProperty()
], ReadonlyArrayDto.prototype, "names", void 0);
__decorate([
    ApiProperty()
], ReadonlyArrayDto.prototype, "ids", void 0);
__decorate([
    ApiProperty()
], ReadonlyArrayDto.prototype, "nested", void 0);
`;

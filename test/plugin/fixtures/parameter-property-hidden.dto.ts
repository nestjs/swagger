export const parameterPropertyHiddenDtoText = `
export class ParameterPropertyHiddenDto {
  constructor(
    readonly plainValue: string,
    @Expose() readonly exposedValue: string,
    @ApiHideProperty() readonly hiddenValue: string,
    @Exclude() private excludedValue: string
  ) {}
}
`;

export const parameterPropertyHiddenDtoTextTranspiled = (
  exclusive?: boolean
) => {
  const plainValue = exclusive
    ? ''
    : 'plainValue: { required: true, type: () => String }, ';

  return `import * as openapi from "@nestjs/swagger";
let ParameterPropertyHiddenDto = class ParameterPropertyHiddenDto {
    constructor(plainValue, exposedValue, hiddenValue, excludedValue) {
        this.plainValue = plainValue;
        this.exposedValue = exposedValue;
        this.hiddenValue = hiddenValue;
        this.excludedValue = excludedValue;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { ${plainValue}exposedValue: { required: true, type: () => String } };
    }
};
ParameterPropertyHiddenDto = __decorate([
    __param(1, Expose()),
    __param(2, ApiHideProperty()),
    __param(3, Exclude())
], ParameterPropertyHiddenDto);
export { ParameterPropertyHiddenDto };
`;
};

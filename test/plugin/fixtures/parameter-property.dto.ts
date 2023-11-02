export const parameterPropertyDtoText = `
export class ParameterPropertyDto {
  constructor(
    readonly readonlyValue?: string, 
    private privateValue: string | null, 
    public publicValue: ItemDto[], 
    regularParameter: string
    protected protectedValue: string = '1234', 
) {}
}

export enum LettersEnum {
  A = 'A',
  B = 'B',
  C = 'C'
}

export class ItemDto {
  constructor(readonly enumValue: LettersEnum) {}
}
`;

export const parameterPropertyDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
export class ParameterPropertyDto {
    constructor(readonlyValue, privateValue, publicValue, regularParameter, protectedValue = '1234') {
        this.readonlyValue = readonlyValue;
        this.privateValue = privateValue;
        this.publicValue = publicValue;
        this.protectedValue = protectedValue;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { readonlyValue: { required: false, type: () => String }, privateValue: { required: true, type: () => String, nullable: true }, publicValue: { required: true, type: () => [require("./parameter-property.dto").ItemDto] }, protectedValue: { required: true, type: () => String, default: "1234" } };
    }
}
export var LettersEnum;
(function (LettersEnum) {
    LettersEnum["A"] = "A";
    LettersEnum["B"] = "B";
    LettersEnum["C"] = "C";
})(LettersEnum || (LettersEnum = {}));
export class ItemDto {
    constructor(enumValue) {
        this.enumValue = enumValue;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { enumValue: { required: true, enum: require("./parameter-property.dto").LettersEnum } };
    }
}
`;

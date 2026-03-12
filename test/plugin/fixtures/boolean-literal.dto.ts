export const booleanLiteralDtoText = `
export class BooleanLiteralDto {
  propTrue: true;
  propFalse: false;
  propBoolLitUnion: true | false;
  propOptionalTrue?: true;
}
`;

export const booleanLiteralDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
export class BooleanLiteralDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { propTrue: { required: true, type: () => Boolean }, propFalse: { required: true, type: () => Boolean }, propBoolLitUnion: { required: true, type: () => Boolean }, propOptionalTrue: { required: false, type: () => Boolean } };
    }
}
`;

export const originalCatDtoText = `
export class ChangedCatDto {
  name: string;
  status: string;
}
`;

export const changedCatDtoText = `
export class ChangedCatDto {
  name: string;
}
`;

export const changedCatDtoTextTranspiled = `\"use strict\";
Object.defineProperty(exports, \"__esModule\", { value: true });
exports.ChangedCatDto = void 0;
var openapi = require(\"@nestjs/swagger\");
var ChangedCatDto = /** @class */ (function () {
    function ChangedCatDto() {
    }
    ChangedCatDto._OPENAPI_METADATA_FACTORY = function () {
        return { name: { required: true, type: function () { return String; } } };
    };
    return ChangedCatDto;
}());
exports.ChangedCatDto = ChangedCatDto;
`;

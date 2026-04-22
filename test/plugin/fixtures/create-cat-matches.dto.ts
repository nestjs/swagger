export const createCatMatchesDtoText = `import { Matches } from 'class-validator';

export class CreateCatDto {
  @Matches(/^abc$/i)
  a: string;

  @Matches(/\\d+/)
  b: string;

  @Matches('plain-string')
  c: string;
}`;

export const createCatMatchesDtoTextTranspiled = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCatDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCatDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { a: { required: true, type: () => String, pattern: "^abc$" }, b: { required: true, type: () => String, pattern: "\\\\d+" }, c: { required: true, type: () => String, pattern: "plain-string" } };
    }
}
exports.CreateCatDto = CreateCatDto;
__decorate([
    (0, class_validator_1.Matches)(/^abc$/i)
], CreateCatDto.prototype, "a", void 0);
__decorate([
    (0, class_validator_1.Matches)(/\\d+/)
], CreateCatDto.prototype, "b", void 0);
__decorate([
    (0, class_validator_1.Matches)('plain-string')
], CreateCatDto.prototype, "c", void 0);
`;

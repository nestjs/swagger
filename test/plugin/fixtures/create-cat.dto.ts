export const createCatDtoText = `
import { IsInt, IsString } from 'class-validator';

enum Status {
    ENABLED,
    DISABLED
}

enum OneValueEnum {
    ONE
}

interface Node {
    id: number;
}

export class CreateCatDto {
  name: string;
  @Min(0)
  @Max(10)
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status;
  statusArr?: Status[];
  oneValueEnum?: OneValueEnum;
  oneValueEnumArr?: OneValueEnum[];

  @ApiProperty({ type: String })
  @IsString()
  readonly breed?: string;

  nodes: Node[];

  date: Date;

  @ApiHideProperty()
  hidden: number;

  static staticProperty: string;
}
`;

export const createCatDtoTextTranspiled = `import { IsString } from 'class-validator';
var Status;
(function (Status) {
    Status[Status[\"ENABLED\"] = 0] = \"ENABLED\";
    Status[Status[\"DISABLED\"] = 1] = \"DISABLED\";
})(Status || (Status = {}));
var OneValueEnum;
(function (OneValueEnum) {
    OneValueEnum[OneValueEnum[\"ONE\"] = 0] = \"ONE\";
})(OneValueEnum || (OneValueEnum = {}));
let CreateCatDto = /** @class */ (() => {
    class CreateCatDto {
        constructor() {
            this.age = 3;
            this.status = Status.ENABLED;
        }
        static _OPENAPI_METADATA_FACTORY() {
            return { name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, status2: { required: false, enum: Status }, statusArr: { required: false, enum: Status, isArray: true }, oneValueEnum: { required: false, enum: OneValueEnum }, oneValueEnumArr: { required: false, enum: OneValueEnum }, breed: { required: false, type: () => String }, nodes: { required: true, type: () => [Object] }, date: { required: true, type: () => Date } };
        }
    }
    __decorate([
        Min(0),
        Max(10)
    ], CreateCatDto.prototype, \"age\", void 0);
    __decorate([
        ApiProperty({ type: String }),
        IsString()
    ], CreateCatDto.prototype, \"breed\", void 0);
    __decorate([
        ApiHideProperty()
    ], CreateCatDto.prototype, \"hidden\", void 0);
    return CreateCatDto;
})();
export { CreateCatDto };
`;

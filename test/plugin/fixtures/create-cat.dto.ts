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

class OtherNode {
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

  /** this is breed im comment */
  @ApiProperty({ description: "this is breed", type: String })
  @IsString()
  readonly breed?: string;

  nodes: Node[];
  optionalBoolean?: boolean;
  date: Date;
  
  twoDimensionPrimitives: string[][];
  twoDimensionNodes: OtherNode[][];

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
class OtherNode {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => Number } };
    }
}
export class CreateCatDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, status2: { required: false, enum: Status }, statusArr: { required: false, enum: Status, isArray: true }, oneValueEnum: { required: false, enum: OneValueEnum }, oneValueEnumArr: { required: false, enum: OneValueEnum, isArray: true }, breed: { required: false, type: () => String, title: "this is breed im comment" }, nodes: { required: true, type: () => [Object] }, optionalBoolean: { required: false, type: () => Boolean }, date: { required: true, type: () => Date }, twoDimensionPrimitives: { required: true, type: () => [[String]] }, twoDimensionNodes: { required: true, type: () => [[OtherNode]] } };
    }
}
__decorate([
    Min(0),
    Max(10)
], CreateCatDto.prototype, \"age\", void 0);
__decorate([
    ApiProperty({ description: "this is breed", type: String }),
    IsString()
], CreateCatDto.prototype, \"breed\", void 0);
__decorate([
    ApiHideProperty()
], CreateCatDto.prototype, \"hidden\", void 0);
`;

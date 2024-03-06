export const createCatPriorityDtoText = `
import { IsInt, IsString, IsPositive, IsNegative, Length, Matches, IsIn } from 'class-validator';

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
  @IsIn(['a', 'b'])
  isIn: string;
  @Matches(/^[+]?abc$/)
  pattern: string;
  name: string;
  @Min(0)
  @Max(10)
  age: number = 3;
  @IsPositive()
  positive: number = 5;
  @IsNegative()
  negative: number = -1;
  @Length(2)
  lengthMin: string;
  @Length(3, 5)
  lengthMinMax: string;
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

  @Expose()
  @ApiHideProperty()
  hidden: number;

  @Exclude()
  excluded: number;

  static staticProperty: string;
}
`;

export const createCatPriorityDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
import { IsString, IsPositive, IsNegative, Length, Matches, IsIn } from 'class-validator';
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
        this.positive = 5;
        this.negative = -1;
        this.status = Status.ENABLED;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { isIn: { required: true, type: () => String, enum: ['a', 'b'] }, pattern: { required: true, type: () => String, pattern: "/^[+]?abc$/" }, name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 }, positive: { required: true, type: () => Number, default: 5, minimum: 1 }, negative: { required: true, type: () => Number, default: -1, maximum: -1 }, lengthMin: { required: true, type: () => String, minLength: 2 }, lengthMinMax: { required: true, type: () => String, minLength: 3, maxLength: 5 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, status2: { required: false, enum: Status }, statusArr: { required: false, enum: Status, isArray: true }, oneValueEnum: { required: false, enum: OneValueEnum }, oneValueEnumArr: { required: false, enum: OneValueEnum }, breed: { required: false, type: () => String, title: "this is breed im comment" }, nodes: { required: true, type: () => [Object] }, optionalBoolean: { required: false, type: () => Boolean }, date: { required: true, type: () => Date }, twoDimensionPrimitives: { required: true, type: () => [[String]] }, twoDimensionNodes: { required: true, type: () => [[OtherNode]] } };
    }
}
__decorate([
    IsIn(['a', 'b'])
], CreateCatDto.prototype, \"isIn\", void 0);
__decorate([
    Matches(/^[+]?abc$/)
], CreateCatDto.prototype, \"pattern\", void 0);
__decorate([
    Min(0),
    Max(10)
], CreateCatDto.prototype, \"age\", void 0);
__decorate([
    IsPositive()
], CreateCatDto.prototype, \"positive\", void 0);
__decorate([
    IsNegative()
], CreateCatDto.prototype, \"negative\", void 0);
__decorate([
    Length(2)
], CreateCatDto.prototype, \"lengthMin\", void 0);
__decorate([
    Length(3, 5)
], CreateCatDto.prototype, \"lengthMinMax\", void 0);
__decorate([
    ApiProperty({ description: "this is breed", type: String }),
    IsString()
], CreateCatDto.prototype, \"breed\", void 0);
__decorate([
    Expose(),
    ApiHideProperty()
], CreateCatDto.prototype, \"hidden\", void 0);
__decorate([
    Exclude()
], CreateCatDto.prototype, "excluded", void 0);
`;

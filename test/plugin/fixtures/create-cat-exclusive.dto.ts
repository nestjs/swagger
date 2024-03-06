export const createCatExclusiveDtoText = `
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

  @ApiHideProperty()
  hidden: number;

  @Exclude()
  excluded: number;

  @Expose()
  exposed: number;

  static staticProperty: string;
}
`;

export const createCatExclusiveDtoTextTranspiled = `import * as openapi from "@nestjs/swagger";
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
        return {};
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
        return { breed: { required: false, type: () => String, title: "this is breed im comment" }, exposed: { required: true, type: () => Number } };
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
    ApiHideProperty()
], CreateCatDto.prototype, \"hidden\", void 0);
__decorate([
    Exclude()
], CreateCatDto.prototype, "excluded", void 0);
__decorate([
    Expose()
], CreateCatDto.prototype, "exposed", void 0);
`;

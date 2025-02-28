export const createCatDtoText = `
import { UUID } from 'crypto';
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
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(10)
  names: string[];
  @ArrayMinSize(1)
  employees: string[];
  @IsDivisibleBy(2)
  nominator: string;
  @IsBase64()
  encodedInfo: string;
  @IsCreditCard()
  creditCard: string;
  @IsCurrency()
  currency: string;
  @IsEmail()
  email: string;
  @IsJSON()
  response: Record<string, any>;
  @IsUrl()
  githubAccount: string;
  @IsUUID()
  transactionId: string;
  @IsMobilePhone()
  phoneNumber: string;
  @IsAscii()
  char: string;
  @IsHexColor()
  color: string;
  @IsHexadecimal()
  hex: string;
  @Contains('log_')
  searchBy: string;
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

  cryptoUUIDProperty: UUID;

  arrayOfUUIDs: UUID[];

  #privateProperty: string;
}
`;

export const createCatDtoTextTranspiled = `var _CreateCatDto_privateProperty;
import * as openapi from "@nestjs/swagger";
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
        _CreateCatDto_privateProperty.set(this, void 0);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { isIn: { required: true, type: () => String, enum: ['a', 'b'] }, pattern: { required: true, type: () => String, pattern: "/^[+]?abc$/" }, name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 }, positive: { required: true, type: () => Number, default: 5, minimum: 1 }, negative: { required: true, type: () => Number, default: -1, maximum: -1 }, lengthMin: { required: true, type: () => String, minLength: 2 }, lengthMinMax: { required: true, type: () => String, minLength: 3, maxLength: 5 }, names: { required: true, type: () => [String], minItems: 1, uniqueItems: true, maxItems: 10 }, employees: { required: true, type: () => [String], minItems: 1 }, nominator: { required: true, type: () => String, multipleOf: 2 }, encodedInfo: { required: true, type: () => String, format: "base64" }, creditCard: { required: true, type: () => String, format: "credit-card" }, currency: { required: true, type: () => String, format: "currency" }, email: { required: true, type: () => String, format: "email" }, response: { required: true, type: () => Object, format: "json" }, githubAccount: { required: true, type: () => String, format: "uri" }, transactionId: { required: true, type: () => String, format: "uuid" }, phoneNumber: { required: true, type: () => String, format: "mobile-phone" }, char: { required: true, type: () => String, pattern: "^[\\\\x00-\\\\x7F]+$" }, color: { required: true, type: () => String, pattern: "^#?([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$" }, hex: { required: true, type: () => String, pattern: "^(0x|0h)?[0-9A-F]+$" }, searchBy: { required: true, type: () => String, pattern: "log_" }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, status2: { required: false, enum: Status }, statusArr: { required: false, enum: Status, isArray: true }, oneValueEnum: { required: false, enum: OneValueEnum }, oneValueEnumArr: { required: false, enum: OneValueEnum, isArray: true }, breed: { required: false, type: () => String, title: "this is breed im comment" }, nodes: { required: true, type: () => [Object] }, optionalBoolean: { required: false, type: () => Boolean }, date: { required: true, type: () => Date }, twoDimensionPrimitives: { required: true, type: () => [[String]] }, twoDimensionNodes: { required: true, type: () => [[OtherNode]] }, cryptoUUIDProperty: { required: true, type: () => String }, arrayOfUUIDs: { required: true, type: () => [String] } };
    }
}
_CreateCatDto_privateProperty = new WeakMap();
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
    ArrayNotEmpty(),
    ArrayUnique(),
    ArrayMaxSize(10)
], CreateCatDto.prototype, \"names\", void 0);
__decorate([
    ArrayMinSize(1)
], CreateCatDto.prototype, \"employees\", void 0);
__decorate([
    IsDivisibleBy(2)
], CreateCatDto.prototype, \"nominator\", void 0);
__decorate([
    IsBase64()
], CreateCatDto.prototype, "encodedInfo", void 0);
__decorate([
    IsCreditCard()
], CreateCatDto.prototype, "creditCard", void 0);
__decorate([
    IsCurrency()
], CreateCatDto.prototype, "currency", void 0);
__decorate([
    IsEmail()
], CreateCatDto.prototype, "email", void 0);
__decorate([
    IsJSON()
], CreateCatDto.prototype, "response", void 0);
__decorate([
    IsUrl()
], CreateCatDto.prototype, "githubAccount", void 0);
__decorate([
    IsUUID()
], CreateCatDto.prototype, "transactionId", void 0);
__decorate([
    IsMobilePhone()
], CreateCatDto.prototype, "phoneNumber", void 0);
__decorate([
    IsAscii()
], CreateCatDto.prototype, \"char\", void 0);
__decorate([
    IsHexColor()
], CreateCatDto.prototype, \"color\", void 0);
__decorate([
    IsHexadecimal()
], CreateCatDto.prototype, \"hex\", void 0);
__decorate([
    Contains('log_')
], CreateCatDto.prototype, \"searchBy\", void 0);
__decorate([
    ApiProperty({ description: "this is breed", type: String }),
    IsString()
], CreateCatDto.prototype, \"breed\", void 0);
__decorate([
    ApiHideProperty()
], CreateCatDto.prototype, \"hidden\", void 0);
`;

export const createCatDtoText = `
import { IsInt, IsString } from 'class-validator';

enum Status {
    ENABLED,
    DISABLED
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
export class CreateCatDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, status2: { required: false, enum: Status }, breed: { required: false, type: () => String }, nodes: { required: true, type: () => [Object] }, date: { required: true, type: () => Date } };
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
`;

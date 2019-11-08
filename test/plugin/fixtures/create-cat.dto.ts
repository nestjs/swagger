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

  @ApiProperty({ type: String })
  @IsString()
  readonly breed?: string;

  nodes: Node[];

  @ApiHideProperty()
  hidden: number;
}
`;

export const createCatDtoTextTranspiled = `import { IsString } from 'class-validator';
var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
export class CreateCatDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
}
__decorate([
    openapi.ApiProperty({ required: true, type: () => String })
], CreateCatDto.prototype, \"name\", void 0);
__decorate([
    Min(0),
    Max(10),
    openapi.ApiProperty({ required: true, type: () => Number, default: 3, minimum: 0, maximum: 10 })
], CreateCatDto.prototype, \"age\", void 0);
__decorate([
    openapi.ApiProperty({ required: true, type: () => [String] })
], CreateCatDto.prototype, \"tags\", void 0);
__decorate([
    openapi.ApiProperty({ required: true, default: Status.ENABLED, enum: Status })
], CreateCatDto.prototype, \"status\", void 0);
__decorate([
    ApiProperty({ type: String, required: false }),
    IsString()
], CreateCatDto.prototype, \"breed\", void 0);
__decorate([
    openapi.ApiProperty({ required: true })
], CreateCatDto.prototype, "nodes", void 0);
__decorate([
    ApiHideProperty()
], CreateCatDto.prototype, "hidden", void 0);
`;

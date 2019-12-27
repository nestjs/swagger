export const createCatDtoAltText = `
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
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  readonly breed?: string;
  nodes: Node[];
}
`;

export const createCatDtoTextAltTranspiled = `var Status;
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
        return { name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, breed: { required: false, type: () => String }, nodes: { required: true } };
    }
}
`;

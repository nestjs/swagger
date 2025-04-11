export const createCatDtoAltText = `
import { IsInt, IsString } from 'class-validator';
import * as package from 'class-validator';

enum Status {
    ENABLED,
    DISABLED
}

interface Node {
    id: number;
}

type AliasedType = {
    type: string;
};
type NumberAlias = number;

export class CreateCatDto2 {
  @package.IsString()
  name: string;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  readonly breed?: string | undefined;
  nodes: Node[];
  alias: AliasedType;
  /** NumberAlias */
  numberAlias: NumberAlias;
  union: 1 | 2;
  intersection: Function & string;
  str: string[];
  rawArray: { foo: string }[];
  nested: {
      first: string,
      second: number,
      status: Status,
      tags: string[],
      nodes: Node[]
      alias: AliasedType,
      numberAlias: NumberAlias,
  };
  prop:{
    [x: string]: string;
  }
  amount: bigint;
  #privateProperty: string;
}
`;

export const createCatDtoTextAltTranspiled = `var _CreateCatDto2_privateProperty;
import * as openapi from "@nestjs/swagger";
import * as package from 'class-validator';
var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
export class CreateCatDto2 {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
        _CreateCatDto2_privateProperty.set(this, void 0);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, age: { required: true, type: () => Number, default: 3 }, tags: { required: true, type: () => [String] }, status: { required: true, default: Status.ENABLED, enum: Status }, breed: { required: false, type: () => String }, nodes: { required: true, type: () => [Object] }, alias: { required: true, type: () => Object }, numberAlias: { required: true, type: () => Number, description: "NumberAlias" }, union: { required: true, type: () => Object }, intersection: { required: true, type: () => Object }, str: { required: true, type: () => [String] }, rawArray: { required: true, type: () => [({ foo: { required: true, type: () => String } })] }, nested: { required: true, type: () => ({ first: { required: true, type: () => String }, second: { required: true, type: () => Number }, status: { required: true, enum: Status }, tags: { required: true, type: () => [String] }, nodes: { required: true, type: () => [Object] }, alias: { required: true, type: () => Object }, numberAlias: { required: true, type: () => Number } }) }, amount: { required: true, type: () => BigInt } };
    }
}
_CreateCatDto2_privateProperty = new WeakMap();
__decorate([
    package.IsString()
], CreateCatDto2.prototype, "name", void 0);
`;

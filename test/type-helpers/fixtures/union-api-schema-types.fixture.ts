import { getSchemaPath } from '../../../lib/utils';
import {
  createUnionApiSchema,
  InferUnionApiSchema
} from '../../../lib/type-helpers';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value
  >() => Value extends Right ? 1 : 2
    ? true
    : false;

type Expect<Value extends true> = Value;

class CatDto {
  meow: string;
}

class DogDto {
  bark: string;
}

abstract class AbstractPetDto {
  abstract type: string;
}

const Pet = createUnionApiSchema({
  name: 'Pet',
  oneOf: [CatDto, DogDto]
});

type _Pet = Expect<Equal<InferUnionApiSchema<typeof Pet>, CatDto | DogDto>>;

const AbstractPet = createUnionApiSchema({
  name: 'AbstractPet',
  oneOf: [AbstractPetDto, CatDto]
});

type _AbstractPet = Expect<
  Equal<InferUnionApiSchema<typeof AbstractPet>, AbstractPetDto | CatDto>
>;

const Scalar = createUnionApiSchema({
  name: 'Scalar',
  oneOf: [String, Number, Boolean, Array, Date, BigInt]
});

type _Scalar = Expect<
  Equal<
    InferUnionApiSchema<typeof Scalar>,
    string | number | boolean | unknown[] | Date | bigint
  >
>;

const ObjectSchema = createUnionApiSchema({
  name: 'ObjectValue',
  oneOf: [Object]
});

type _Object = Expect<Equal<InferUnionApiSchema<typeof ObjectSchema>, object>>;

const Result = createUnionApiSchema({
  name: 'Result',
  oneOf: [Pet, String]
});

type _Result = Expect<
  Equal<InferUnionApiSchema<typeof Result>, CatDto | DogDto | string>
>;

// @ts-expect-error schema tokens are metadata hosts, not constructors
new Pet();

createUnionApiSchema({
  name: 'Empty',
  // @ts-expect-error oneOf must be a non-empty tuple
  oneOf: []
});

createUnionApiSchema({
  name: 'Reference',
  // @ts-expect-error inferred unions accept model tokens, not raw references
  oneOf: [{ $ref: getSchemaPath(CatDto) }]
});

createUnionApiSchema({
  name: 'Function',
  // @ts-expect-error Function does not describe an API schema
  oneOf: [Function]
});

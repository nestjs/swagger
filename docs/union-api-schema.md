# Reusable union schemas

Use `createUnionApiSchema()` when several endpoints or properties should reference
the same named OpenAPI `oneOf` component.

## Define a schema token and an application type

```typescript
import {
  ApiProperty,
  createUnionApiSchema,
  InferUnionApiSchema
} from '@nestjs/swagger';

export class CatDto {
  @ApiProperty({ enum: ['cat'] })
  kind: 'cat';

  @ApiProperty()
  meow: string;
}

export class DogDto {
  @ApiProperty({ enum: ['dog'] })
  kind: 'dog';

  @ApiProperty()
  bark: string;
}

export const Pet = createUnionApiSchema({
  name: 'Pet',
  oneOf: [CatDto, DogDto],
  description: 'A cat or a dog',
  discriminator: {
    propertyName: 'kind',
    mapping: { cat: CatDto, dog: DogDto }
  }
});

export type Pet = InferUnionApiSchema<typeof Pet>;
```

The `const` is a runtime schema token for Swagger decorators. The type alias is
`CatDto | DogDto` and is used in application signatures. TypeScript allows them to
share a name. The token is not a DTO constructor: do not instantiate it, extend
it, or use it as a class-transformer target. The factory does not validate,
instantiate, or transform request and response values.

`UnionApiSchema<Result>` is the public type of a schema token. To declare options
separately, keep the members as a non-empty tuple and use
`UnionApiSchemaOptions<typeof members>`:

```typescript
import { UnionApiSchemaOptions } from '@nestjs/swagger';

const members = [CatDto, DogDto] as const;
const options: UnionApiSchemaOptions<typeof members> = {
  name: 'Pet',
  oneOf: members
};
```

Choose a non-empty component name that is distinct from its member schema names.

## Use the token explicitly

```typescript
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { Pet } from './pet.dto';

class PetListDto {
  @ApiProperty({ type: () => Pet, isArray: true })
  pets: Pet[];

  @ApiProperty({ type: () => Pet, nullable: true })
  featured: Pet | null;
}

@Controller('pets')
export class PetsController {
  @Get()
  @ApiOkResponse({ type: PetListDto })
  findAll(): PetListDto {
    return { pets: [], featured: null };
  }

  @Post()
  @ApiBody({ type: () => Pet })
  create(@Body() pet: Pet): void {}
}
```

Use `type: Pet` or `type: () => Pet` explicitly in Swagger decorators. A
TypeScript union annotation alone does not retain the token in reflection
metadata. Configure request validation separately.

The factory automatically registers member DTOs and discriminator mapping targets
using `ApiExtraModels`. Members with `@ApiSchema({ name: 'CustomName' })` use that
component name in both references and discriminator mappings. A mapping target
outside `oneOf` is registered, but is not added to the union or its inferred
TypeScript type; list every intended alternative in `oneOf`.

Nullable properties and `@ApiOkResponse({ type: Pet, nullable: true })` allow
`null` at that use site without changing the shared component. For raw combinator
references, the generated schema wraps the reference and an `enum: [null]`
alternative in `anyOf`, so non-nullable uses keep
their original constraints. This representation uses schema keywords supported
by both OpenAPI 3.0 and 3.1.

## Built-in types and nested unions

```typescript
export const Scalar = createUnionApiSchema({
  name: 'Scalar',
  oneOf: [String, Number]
});
export type Scalar = InferUnionApiSchema<typeof Scalar>; // string | number

export const Result = createUnionApiSchema({
  name: 'Result',
  oneOf: [Pet, String]
});
export type Result = InferUnionApiSchema<typeof Result>; // CatDto | DogDto | string
```

Supported built-in members are `String`, `Number`, `Boolean`, `Object`, `Date`,
and `BigInt`. `Date` emits a string with `date-time` format, and `BigInt` emits an
integer with `int64` format. Their inferred application types remain `Date` and
`bigint`; the factory does not serialize them. In particular, JSON serialization
of `bigint` needs application-specific handling.

`Array` has no element schema and is rejected, as is `Function`. Use
`isArray: true` on the consuming decorator for arrays of union values. Empty member lists,
arrays with missing entries, and invalid constructors are rejected at runtime.
Repeated members are deduplicated. Conflicting component names in the member and
extra-model graph, including nested unions and discriminator targets, are
rejected. Models discovered through DTO properties, inline objects, or plugin
metadata are checked when the Swagger document is generated, after lazy type
resolvers can safely run. This includes previously registered models and models
discovered before a recursive reference to the union. Named enums share the same
component namespace and cannot reuse a model or union name in this graph.
Standard Schema components cannot reuse a model or enum name in this graph,
regardless of registration order.
Recursive references to the same model and repeated references to a named enum
are allowed.

## `oneOf` requires mutually exclusive alternatives

The inferred TypeScript union does not prove that the OpenAPI alternatives are
disjoint. A payload must match **exactly one** member schema:

- `[Number, BigInt]` produces `number` and `integer` alternatives. An integer
  matches both and fails `oneOf`.
- `[String, Date]` can match both alternatives for a date-time string.
- Two object DTOs with overlapping properties can both match the same payload.
  Required discriminator properties with distinct literal enums, as above, make
  the alternatives mutually exclusive.

Choose disjoint members when using this factory. If overlapping alternatives are
intentional, use a raw `anyOf` schema with `ApiSchema` and register referenced
models with `ApiExtraModels`. See the
[OpenAPI composition rules](https://spec.openapis.org/oas/v3.0.3.html#discriminator-object).

## Raw schema foundation

The factory composes the existing `ApiSchema` and `ApiExtraModels` APIs. It uses
the same schema registration path as a raw `@ApiSchema({ oneOf: ... })` host.
`oneOf` and `anyOf` hosts describe alternatives without reflecting class
properties. `allOf` hosts preserve decorated class properties alongside the
composition. An explicitly undefined combinator leaves regular DTO reflection
unchanged.

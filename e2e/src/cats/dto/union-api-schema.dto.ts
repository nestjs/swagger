import {
  ApiProperty,
  createUnionApiSchema,
  InferUnionApiSchema
} from '../../../../lib/index.js';

export class UnionCatDto {
  @ApiProperty({ enum: ['cat'] })
  type: 'cat' = 'cat';

  @ApiProperty()
  meow: string;
}

export class UnionDogDto {
  @ApiProperty({ enum: ['dog'] })
  type: 'dog' = 'dog';

  @ApiProperty()
  bark: string;
}

export const Pet = createUnionApiSchema({
  name: 'Pet',
  oneOf: [UnionCatDto, UnionDogDto],
  discriminator: {
    propertyName: 'type',
    mapping: {
      cat: UnionCatDto,
      dog: UnionDogDto
    }
  }
});

export type Pet = InferUnionApiSchema<typeof Pet>;

export class PetListDto {
  @ApiProperty({ type: () => Pet, isArray: true })
  pets: Pet[];
}

export const Scalar = createUnionApiSchema({
  name: 'Scalar',
  oneOf: [String, Number]
});

export type Scalar = InferUnionApiSchema<typeof Scalar>;

export class UnionErrorDto {
  @ApiProperty({ enum: ['error'] })
  type: 'error' = 'error';

  @ApiProperty()
  message: string;
}

export const UnionResult = createUnionApiSchema({
  name: 'UnionResult',
  oneOf: [Pet, UnionErrorDto, String]
});

export type UnionResult = InferUnionApiSchema<typeof UnionResult>;

import { join } from 'node:path';
import * as ts from 'typescript';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty, ApiSchema } from '../../lib/decorators';
import {
  createUnionApiSchema,
  InferUnionApiSchema
} from '../../lib/type-helpers';
import { generateSchema } from '../../lib/utils';

class CatDto {
  @ApiProperty({ enum: ['cat'] })
  type: 'cat' = 'cat';

  @ApiProperty()
  meow: string;
}

class DogDto {
  @ApiProperty({ enum: ['dog'] })
  type: 'dog' = 'dog';

  @ApiProperty()
  bark: string;
}

const Pet = createUnionApiSchema({
  name: 'Pet',
  oneOf: [CatDto, DogDto],
  discriminator: {
    propertyName: 'type',
    mapping: {
      cat: CatDto,
      dog: DogDto
    }
  }
});

type Pet = InferUnionApiSchema<typeof Pet>;

describe('createUnionApiSchema', () => {
  it('infers its public type contract', () => {
    const program = ts.createProgram(
      [join(__dirname, 'fixtures', 'union-api-schema-types.fixture.ts')],
      {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        noImplicitAny: false,
        skipLibCheck: true,
        strictNullChecks: false,
        strictPropertyInitialization: false,
        target: ts.ScriptTarget.ES2021,
        types: ['node']
      }
    );

    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );

    expect(diagnostics).toEqual([]);
  });

  it('generates references for DTO members', () => {
    expect(generateSchema(Pet).schema).toEqual({
      oneOf: [
        { $ref: '#/components/schemas/CatDto' },
        { $ref: '#/components/schemas/DogDto' }
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          cat: '#/components/schemas/CatDto',
          dog: '#/components/schemas/DogDto'
        }
      }
    });
  });

  it('registers DTO members as extra models', () => {
    expect(Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Pet)).toEqual([
      CatDto,
      DogDto
    ]);

    const { schemas } = generateSchema(Pet);
    expect(schemas.CatDto).toBeDefined();
    expect(schemas.DogDto).toBeDefined();
  });

  it('generates inline schemas for Swagger built-in types', () => {
    const Scalar = createUnionApiSchema({
      name: 'Scalar',
      oneOf: [String, Number, Boolean, Object, Array, Date, BigInt]
    });

    expect(generateSchema(Scalar).schema).toEqual({
      oneOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
        { type: 'array', items: {} },
        { type: 'string', format: 'date-time' },
        { type: 'integer', format: 'int64' }
      ]
    });
    expect(Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Scalar)).toEqual(
      []
    );
  });

  it('supports descriptions and custom DTO schema names', () => {
    @ApiSchema({ name: 'Feline' })
    class CustomCatDto {}

    const Schema = createUnionApiSchema({
      name: 'CustomPet',
      description: 'A cat or dog',
      oneOf: [CustomCatDto, DogDto]
    });

    expect(generateSchema(Schema).schema).toEqual({
      description: 'A cat or dog',
      oneOf: [
        { $ref: '#/components/schemas/Feline' },
        { $ref: '#/components/schemas/DogDto' }
      ]
    });
  });

  it('rejects a member with the same component name as the union', () => {
    @ApiSchema({ name: 'Collision' })
    class CollidingDto {}

    expect(() =>
      createUnionApiSchema({
        name: 'Collision',
        oneOf: [CollidingDto]
      })
    ).toThrow(
      'Union schema "Collision" cannot reference a member with the same schema name.'
    );
  });

  it('supports nested union tokens', () => {
    const Result = createUnionApiSchema({
      name: 'Result',
      oneOf: [Pet, String]
    });

    const { schema, schemas } = generateSchema(Result);

    expect(schema).toEqual({
      oneOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'string' }]
    });
    expect(schemas.Pet).toBeDefined();
    expect(schemas.CatDto).toBeDefined();
    expect(schemas.DogDto).toBeDefined();
  });

  it('does not expose a constructor for the represented union', () => {
    expect(Pet.name).toBe('UnionApiSchemaHost');
    expect(() => new (Pet as any)()).not.toThrow();
  });

  it('isolates generated documents from schema mutations', () => {
    const first = generateSchema(Pet).schema;
    (first.oneOf[0] as { $ref: string }).$ref =
      '#/components/schemas/MutatedDto';

    expect(generateSchema(Pet).schema.oneOf[0]).toEqual({
      $ref: '#/components/schemas/CatDto'
    });
  });

  it('rejects Function when the type contract is bypassed', () => {
    expect(() =>
      createUnionApiSchema({
        name: 'Invalid',
        oneOf: [Function]
      } as any)
    ).toThrow('Function does not describe an API schema.');
  });
});

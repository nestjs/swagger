import { join } from 'node:path';
import * as ts from 'typescript';
import { DECORATORS } from '../../lib/constants';
import {
  ApiProperty,
  ApiSchema,
  createUnionApiSchema,
  InferUnionApiSchema,
  UnionApiSchema
} from '../../lib/decorators';
import { SchemaObject } from '../../lib/interfaces';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

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
      [join(__dirname, 'union-api-schema-types.fixture.ts')],
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
    expect(exploreUnionSchema(Pet).schema).toEqual({
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

  it('registers DTO members and discriminator targets as extra models', () => {
    class BirdDto {}

    const Schema = createUnionApiSchema({
      name: 'MappedPet',
      oneOf: [CatDto],
      discriminator: {
        propertyName: 'type',
        mapping: { bird: BirdDto }
      }
    });

    expect(Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Schema)).toEqual([
      CatDto,
      BirdDto
    ]);

    const { schemas } = exploreUnionSchema(Schema);
    expect(schemas.CatDto).toBeDefined();
    expect(schemas.BirdDto).toBeDefined();
  });

  it('generates inline schemas through SwaggerTypesMapper', () => {
    const Scalar = createUnionApiSchema({
      name: 'Scalar',
      oneOf: [String, Number, Boolean, Object, Date, BigInt]
    });

    expect(exploreUnionSchema(Scalar).schema).toEqual({
      oneOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
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

    expect(exploreUnionSchema(Schema).schema).toEqual({
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

  it('rejects different models with the same component schema', () => {
    @ApiSchema({ name: 'SharedMember' })
    class FirstDto {}

    @ApiSchema({ name: 'SharedMember' })
    class SecondDto {}

    expect(() =>
      createUnionApiSchema({
        name: 'ConflictingMembers',
        oneOf: [FirstDto, SecondDto]
      })
    ).toThrow(
      'Union schema "ConflictingMembers" cannot reference different models with the same component schema "#/components/schemas/SharedMember".'
    );
  });

  it('supports nested union tokens', () => {
    const Result = createUnionApiSchema({
      name: 'Result',
      oneOf: [Pet, String]
    });

    const { schema, schemas } = exploreUnionSchema(Result);

    expect(schema).toEqual({
      oneOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'string' }]
    });
    expect(schemas.Pet).toBeDefined();
    expect(schemas.CatDto).toBeDefined();
    expect(schemas.DogDto).toBeDefined();
  });

  it('deduplicates equal member schemas', () => {
    const Deduplicated = createUnionApiSchema({
      name: 'Deduplicated',
      oneOf: [CatDto, CatDto, String, String]
    });

    expect(exploreUnionSchema(Deduplicated).schema.oneOf).toEqual([
      { $ref: '#/components/schemas/CatDto' },
      { type: 'string' }
    ]);
  });

  it('exposes a metadata token rather than a public constructor', () => {
    expect(Pet.name).toBe('UnionApiSchemaHost');
  });

  it('isolates generated documents from schema mutations', () => {
    const first = exploreUnionSchema(Pet).schema;
    (first.oneOf[0] as { $ref: string }).$ref =
      '#/components/schemas/MutatedDto';

    expect(exploreUnionSchema(Pet).schema.oneOf[0]).toEqual({
      $ref: '#/components/schemas/CatDto'
    });
  });

  it('rejects empty unions when the type contract is bypassed', () => {
    expect(() =>
      createUnionApiSchema({ name: 'Empty', oneOf: [] } as any)
    ).toThrow('Union schema "Empty" must contain at least one member.');
  });

  it.each([
    [Function, 'Function does not describe an API schema.'],
    [
      Array,
      'Array does not describe a concrete API schema. Use an array DTO instead.'
    ],
    [() => undefined, 'Union members must be model or built-in constructors.'],
    [{}, 'Union members must be model or built-in constructors.']
  ])('rejects invalid member %p', (member, message) => {
    expect(() =>
      createUnionApiSchema({
        name: 'Invalid',
        oneOf: [member]
      } as any)
    ).toThrow(message);
  });

  it('rejects non-constructable discriminator targets', () => {
    expect(() =>
      createUnionApiSchema({
        name: 'InvalidMapping',
        oneOf: [CatDto],
        discriminator: {
          propertyName: 'type',
          mapping: { invalid: (() => undefined) as any }
        }
      })
    ).toThrow(
      'Discriminator mappings must reference model schema constructors.'
    );
  });
});

function exploreUnionSchema(schemaToken: UnionApiSchema<unknown>) {
  const schemas: Record<string, SchemaObject> = {};
  const factory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  const schemaName = factory.exploreModelSchema(schemaToken, schemas);
  return { schema: schemas[schemaName], schemas };
}

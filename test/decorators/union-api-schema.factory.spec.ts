import { join } from 'node:path';
import * as ts from 'typescript';
import { DECORATORS } from '../../lib/constants';
import {
  ApiExtraModels,
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

  it('uses the class name for members decorated with ApiSchema without options', () => {
    @ApiSchema()
    class DefaultNamedDto {}

    const Union = createUnionApiSchema({
      name: 'DefaultNamedUnion',
      oneOf: [DefaultNamedDto, String]
    });
    const { schema, schemas } = exploreUnionSchema(Union);

    expect(schema.oneOf).toEqual([
      { $ref: '#/components/schemas/DefaultNamedDto' },
      { type: 'string' }
    ]);
    expect(schemas.DefaultNamedDto).toEqual({ type: 'object', properties: {} });
  });

  it('uses the class name for discriminator targets decorated with ApiSchema without options', () => {
    @ApiSchema()
    class DefaultNamedDto {}

    const Union = createUnionApiSchema({
      name: 'DefaultNamedMapping',
      oneOf: [CatDto],
      discriminator: {
        propertyName: 'type',
        mapping: { other: DefaultNamedDto }
      }
    });
    const { schema, schemas } = exploreUnionSchema(Union);

    expect(schema.discriminator.mapping.other).toBe(
      '#/components/schemas/DefaultNamedDto'
    );
    expect(schemas.DefaultNamedDto).toEqual({ type: 'object', properties: {} });
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

  it('rejects a nested member with the same schema name as the outer union', () => {
    @ApiSchema({ name: 'Outer' })
    class NestedDto {}

    const Inner = createUnionApiSchema({ name: 'Inner', oneOf: [NestedDto] });

    expect(() =>
      createUnionApiSchema({ name: 'Outer', oneOf: [Inner] })
    ).toThrow(
      'Union schema "Outer" cannot reference a member with the same schema name.'
    );
  });

  it('rejects conflicting models registered by separate nested unions', () => {
    @ApiSchema({ name: 'Shared' })
    class FirstDto {}
    @ApiSchema({ name: 'Shared' })
    class SecondDto {}

    const First = createUnionApiSchema({ name: 'First', oneOf: [FirstDto] });
    const Second = createUnionApiSchema({ name: 'Second', oneOf: [SecondDto] });

    expect(() =>
      createUnionApiSchema({ name: 'Outer', oneOf: [First, Second] })
    ).toThrow(
      'different models with the same component schema "#/components/schemas/Shared"'
    );
  });

  it('checks nested models registered through discriminator mappings', () => {
    @ApiSchema({ name: 'MappedOuter' })
    class NestedDto {}
    const Inner = createUnionApiSchema({
      name: 'MappedInner',
      oneOf: [NestedDto]
    });

    expect(() =>
      createUnionApiSchema({
        name: 'MappedOuter',
        oneOf: [CatDto],
        discriminator: { propertyName: 'type', mapping: { nested: Inner } }
      })
    ).toThrow('cannot reference a member with the same schema name');
  });

  it('checks extra models on raw schema hosts', () => {
    @ApiSchema({ name: 'RawOuter' })
    class NestedDto {}

    @ApiExtraModels(NestedDto)
    @ApiSchema({ oneOf: [{ $ref: '#/components/schemas/RawOuter' }] })
    class RawInner {}

    expect(() =>
      createUnionApiSchema({ name: 'RawOuter', oneOf: [RawInner] })
    ).toThrow('cannot reference a member with the same schema name');
  });

  it('allows shared descendants without flattening extra model registration', () => {
    const OtherPet = createUnionApiSchema({
      name: 'OtherPet',
      oneOf: [CatDto]
    });
    const Result = createUnionApiSchema({
      name: 'SharedResult',
      oneOf: [Pet, OtherPet]
    });

    expect(Reflect.getMetadata(DECORATORS.API_EXTRA_MODELS, Result)).toEqual([
      Pet,
      OtherPet
    ]);
    const { schemas } = exploreUnionSchema(Result);
    expect(schemas.CatDto.properties.meow).toEqual({ type: 'string' });
    expect(schemas.OtherPet.oneOf).toEqual([
      { $ref: '#/components/schemas/CatDto' }
    ]);
  });

  it('supports members with recursive properties', () => {
    class BranchDto {
      @ApiProperty({ type: () => Tree, required: false })
      child?: unknown;
    }
    const Tree = createUnionApiSchema({
      name: 'Tree',
      oneOf: [BranchDto, String]
    });

    expect(exploreUnionSchema(Tree).schemas.BranchDto.properties.child).toEqual(
      {
        $ref: '#/components/schemas/Tree'
      }
    );
  });

  it.each(['property', 'array', 'metadata factory'])(
    'rejects a union name collision discovered through a member %s',
    (source) => {
      @ApiSchema({ name: 'Outer' })
      class NestedDto {
        @ApiProperty({ type: Number })
        id: number;
      }

      class MemberDto {}
      const resolveType = vi.fn(() => NestedDto);
      if (source === 'metadata factory') {
        Object.assign(MemberDto, {
          _OPENAPI_METADATA_FACTORY: () => ({
            nested: { required: true, type: () => resolveType() }
          })
        });
      } else {
        ApiProperty({ type: () => resolveType(), isArray: source === 'array' })(
          MemberDto.prototype,
          'nested'
        );
      }

      const Outer = createUnionApiSchema({
        name: 'Outer',
        oneOf: [MemberDto, String]
      });
      expect(resolveType).not.toHaveBeenCalled();

      expect(() => exploreUnionSchema(Outer)).toThrow(
        'Different models cannot share the component schema "Outer" when used in a raw combinator schema.'
      );
    }
  );

  it.each([false, true])(
    'rejects property model collisions with another member (reverse order: %s)',
    (reverse) => {
      @ApiSchema({ name: 'Shared' })
      class FirstDto {}
      @ApiSchema({ name: 'Shared' })
      class SecondDto {}
      class MemberDto {
        @ApiProperty({ type: () => SecondDto })
        nested: SecondDto;
      }

      const Outer = createUnionApiSchema({
        name: 'Outer',
        oneOf: reverse ? [MemberDto, FirstDto] : [FirstDto, MemberDto]
      });

      expect(() => exploreUnionSchema(Outer)).toThrow(
        'Different models cannot share the component schema "Shared"'
      );
    }
  );

  it('checks cached property dependencies when they become union members', () => {
    @ApiSchema({ name: 'Shared' })
    class FirstDto {}
    @ApiSchema({ name: 'Shared' })
    class SecondDto {}
    class CachedDto {
      @ApiProperty({ type: FirstDto })
      first: FirstDto;

      @ApiProperty({ type: SecondDto })
      second: SecondDto;
    }
    class MemberDto {
      @ApiProperty({ type: CachedDto })
      cached: CachedDto;
    }

    const schemas: Record<string, SchemaObject> = {};
    const factory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    factory.exploreModelSchema(CachedDto, schemas);
    const Outer = createUnionApiSchema({
      name: 'Outer',
      oneOf: [MemberDto, String]
    });

    expect(() => factory.exploreModelSchema(Outer, schemas)).toThrow(
      'Different models cannot share the component schema "Shared"'
    );
    expect(() => factory.exploreModelSchema(Outer, schemas)).toThrow(
      'Different models cannot share the component schema "Shared"'
    );
  });

  it.each([false, true])(
    'shares collision tracking across schema factories (union first: %s)',
    (unionFirst) => {
      @ApiSchema({ name: 'Shared' })
      class ConflictingDto {}
      class ContainerDto {
        @ApiProperty({ type: ConflictingDto })
        nested: ConflictingDto;
      }
      const Shared = createUnionApiSchema({
        name: 'Shared',
        oneOf: [String, Number]
      });
      const firstFactory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
      const secondFactory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
      const schemas: Record<string, SchemaObject> = {};
      firstFactory.exploreModelSchema(
        unionFirst ? Shared : ContainerDto,
        schemas
      );

      expect(() =>
        secondFactory.exploreModelSchema(
          unionFirst ? ContainerDto : Shared,
          schemas
        )
      ).toThrow('Different models cannot share the component schema "Shared"');
      // A separate document may use the same component name independently.
      expect(() =>
        secondFactory.exploreModelSchema(unionFirst ? ContainerDto : Shared, {})
      ).not.toThrow();
    }
  );

  it('allows recursive extra model registration for the same constructor', () => {
    class MemberDto {}
    const Recursive = createUnionApiSchema({
      name: 'Recursive',
      oneOf: [MemberDto, String]
    });
    ApiExtraModels(Recursive)(MemberDto);

    expect(exploreUnionSchema(Recursive).schema.oneOf).toEqual([
      { $ref: '#/components/schemas/MemberDto' },
      { type: 'string' }
    ]);
  });

  it.each([
    { memberFirst: true, cached: false },
    { memberFirst: false, cached: false },
    { memberFirst: true, cached: true },
    { memberFirst: false, cached: true }
  ])(
    'rejects collisions when a recursive graph becomes a union: %j',
    ({ memberFirst, cached }) => {
      @ApiSchema({ name: 'Shared' })
      class FirstDto {}
      @ApiSchema({ name: 'Shared' })
      class SecondDto {}
      class PropertiesDto {
        @ApiProperty({ type: FirstDto })
        first: FirstDto;

        @ApiProperty({ type: SecondDto })
        second: SecondDto;
      }
      class MemberDto {}
      if (cached) {
        ApiProperty({ type: PropertiesDto })(MemberDto.prototype, 'cached');
      } else {
        ApiProperty({ type: FirstDto })(MemberDto.prototype, 'first');
        ApiProperty({ type: SecondDto })(MemberDto.prototype, 'second');
      }
      const Recursive = createUnionApiSchema({
        name: 'Recursive',
        oneOf: [MemberDto, String]
      });
      ApiProperty({ type: () => Recursive, required: false })(
        MemberDto.prototype,
        'child'
      );
      const factory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
      const schemas: Record<string, SchemaObject> = {};
      if (cached) {
        factory.exploreModelSchema(PropertiesDto, schemas);
      }

      expect(() =>
        factory.exploreModelSchema(memberFirst ? MemberDto : Recursive, schemas)
      ).toThrow('Different models cannot share the component schema "Shared"');
    }
  );

  it.each([false, true])(
    'rejects collisions inside nested inline objects (array: %s)',
    (isArray) => {
      @ApiSchema({ name: 'Shared' })
      class FirstDto {}
      @ApiSchema({ name: 'Shared' })
      class SecondDto {}
      class MemberDto {}
      ApiProperty({
        isArray,
        type: {
          nested: {
            type: { first: { type: FirstDto }, second: { type: SecondDto } }
          }
        }
      })(MemberDto.prototype, 'value');
      const Outer = createUnionApiSchema({
        name: 'Outer',
        oneOf: [MemberDto, String]
      });

      expect(() => exploreUnionSchema(Outer)).toThrow(
        'Different models cannot share the component schema "Shared"'
      );
    }
  );

  it.each([false, true])(
    'rejects enum names that collide with their union (array: %s)',
    (isArray) => {
      class MemberDto {}
      ApiProperty({ enum: ['a', 'b'], enumName: 'Outer', isArray })(
        MemberDto.prototype,
        'kind'
      );
      const Outer = createUnionApiSchema({
        name: 'Outer',
        oneOf: [MemberDto, String]
      });

      expect(() => exploreUnionSchema(Outer)).toThrow(
        'Models and enums cannot share the component schema "Outer"'
      );
    }
  );

  it.each([
    { enumFirst: true, source: 'property' },
    { enumFirst: false, source: 'property' },
    { enumFirst: true, source: 'query' },
    { enumFirst: false, source: 'query' }
  ])(
    'rejects registered enum and union name collisions: %j',
    ({ enumFirst, source }) => {
      class EnumDto {
        @ApiProperty({ enum: ['a', 'b'], enumName: 'Shared' })
        kind: string;
      }
      const Shared = createUnionApiSchema({
        name: 'Shared',
        oneOf: [String, Number]
      });
      const factory = new SchemaObjectFactory(
        new ModelPropertiesAccessor(),
        new SwaggerTypesMapper()
      );
      const schemas: Record<string, SchemaObject> = {};
      const registerEnum = () =>
        source === 'property'
          ? factory.exploreModelSchema(EnumDto, schemas)
          : factory.createFromModel(
              [
                {
                  in: 'query',
                  name: 'kind',
                  type: String,
                  enum: ['a', 'b'],
                  enumName: 'Shared'
                }
              ],
              schemas
            );
      const registerUnion = () => factory.exploreModelSchema(Shared, schemas);
      (enumFirst ? registerEnum : registerUnion)();

      expect(enumFirst ? registerUnion : registerEnum).toThrow(
        'Models and enums cannot share the component schema "Shared"'
      );
    }
  );

  it('checks cached enum dependencies when their DTO becomes a union member', () => {
    @ApiSchema({ name: 'Shared' })
    class SharedDto {}
    class MemberDto {
      @ApiProperty({ type: SharedDto })
      value: SharedDto;

      @ApiProperty({ enum: ['a', 'b'], enumName: 'Shared' })
      kind: string;
    }
    const factory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    const schemas: Record<string, SchemaObject> = {};
    factory.exploreModelSchema(MemberDto, schemas);
    const Outer = createUnionApiSchema({
      name: 'Outer',
      oneOf: [MemberDto, String]
    });

    expect(() => factory.exploreModelSchema(Outer, schemas)).toThrow(
      'Models and enums cannot share the component schema "Shared"'
    );
  });

  it('allows recursive inline properties and shared enums from either entry point', () => {
    class MemberDto {
      @ApiProperty({ enum: ['a', 'b'], enumName: 'Kind' })
      kind: string;

      @ApiProperty({ enum: ['a', 'b'], enumName: 'Kind', isArray: true })
      kinds: string[];
    }
    const Recursive = createUnionApiSchema({
      name: 'Recursive',
      oneOf: [MemberDto, String]
    });
    ApiProperty({ type: { child: { type: () => Recursive } } })(
      MemberDto.prototype,
      'nested'
    );
    const factory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    const memberSchemas: Record<string, SchemaObject> = {};
    factory.exploreModelSchema(MemberDto, memberSchemas);
    const { schemas: unionSchemas } = exploreUnionSchema(Recursive);

    expect(memberSchemas).toEqual(unionSchemas);
    expect(memberSchemas.Kind.enum).toEqual(['a', 'b']);
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

  it.each([{ oneOf: new Array(1) }, { oneOf: [CatDto, , String] }])(
    'rejects sparse member arrays %p',
    ({ oneOf }) => {
      expect(() =>
        createUnionApiSchema({ name: 'Sparse', oneOf } as any)
      ).toThrow('Union members must be model or built-in constructors.');
    }
  );

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

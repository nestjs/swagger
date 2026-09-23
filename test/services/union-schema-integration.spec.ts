import {
  ApiProperty,
  ApiSchema,
  createUnionApiSchema
} from '../../lib/decorators';
import { SchemaObject } from '../../lib/interfaces';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ResponseObjectFactory } from '../../lib/services/response-object-factory';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';

const responseFactories = { linkName: () => 'link', operationId: () => 'op' };

describe('Union schema integration', () => {
  describe.each(['union', 'member', 'enum'] as const)(
    'Standard Schema collisions with a %s',
    (target) => {
      it.each([
        { standardFirst: false, source: 'input' },
        { standardFirst: true, source: 'input' },
        { standardFirst: false, source: 'output' },
        { standardFirst: true, source: 'output' },
        { standardFirst: false, source: 'custom' },
        { standardFirst: true, source: 'custom' }
      ])(
        'rejects collisions before overwriting components: %j',
        ({ standardFirst, source }) => {
          class MemberDto {}
          if (target === 'member') {
            ApiSchema({ name: 'Shared' })(MemberDto);
          } else if (target === 'enum') {
            ApiProperty({ enum: ['a', 'b'], enumName: 'Shared' })(
              MemberDto.prototype,
              'kind'
            );
          }
          const Union = createUnionApiSchema({
            name: target === 'union' ? 'Shared' : 'Outer',
            oneOf: [MemberDto, String]
          });
          const customConverter =
            source === 'custom'
              ? () => ({
                  schema: { $ref: '#/components/schemas/Shared' },
                  components: { Shared: { type: 'boolean' } }
                })
              : undefined;
          const factory = new SchemaObjectFactory(
            new ModelPropertiesAccessor(),
            new SwaggerTypesMapper(),
            customConverter
          );
          const responseFactory = new ResponseObjectFactory();
          const schemas: Record<string, SchemaObject> = {};
          const registerStandard = () =>
            source === 'output'
              ? responseFactory.create(
                  { standardSchema: standardSchema('Shared') },
                  ['application/json'],
                  schemas,
                  responseFactories
                )
              : factory.createFromModel(
                  [
                    {
                      in: 'body',
                      name: 'payload',
                      standardSchema: standardSchema('Shared')
                    }
                  ],
                  schemas
                );
          const registerUnion = () =>
            factory.exploreModelSchema(Union, schemas);
          (standardFirst ? registerStandard : registerUnion)();
          const existingComponent = structuredClone(schemas.Shared);

          expect(standardFirst ? registerUnion : registerStandard).toThrow(
            'Standard Schema components cannot share the component schema "Shared"'
          );
          expect(schemas.Shared).toEqual(existingComponent);
        }
      );
    }
  );

  it('checks a previously converted component when its DTO becomes a union member', () => {
    @ApiSchema({ name: 'Shared' })
    class SharedDto {}
    class MemberDto {
      @ApiProperty({ type: SharedDto })
      value: SharedDto;
    }
    const factory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    const schemas: Record<string, SchemaObject> = {};
    factory.exploreModelSchema(MemberDto, schemas);
    factory.createFromModel(
      [
        {
          in: 'body',
          name: 'payload',
          standardSchema: standardSchema('Shared')
        }
      ],
      schemas
    );
    const Union = createUnionApiSchema({
      name: 'Outer',
      oneOf: [MemberDto, String]
    });

    expect(() => factory.exploreModelSchema(Union, schemas)).toThrow(
      'Standard Schema components cannot share the component schema "Shared"'
    );
  });

  it('allows repeated Standard Schema conversions with distinct component names', () => {
    const Union = createUnionApiSchema({
      name: 'Union',
      oneOf: [String, Number]
    });
    const factory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    const schemas: Record<string, SchemaObject> = {};
    factory.exploreModelSchema(Union, schemas);
    for (let i = 0; i < 2; i++) {
      factory.createFromModel(
        [
          {
            in: 'body',
            name: 'payload',
            standardSchema: standardSchema('Boolean')
          }
        ],
        schemas
      );
    }

    expect(schemas.Boolean).toEqual({ type: 'boolean' });
    expect(schemas.Union.oneOf).toEqual([
      { type: 'string' },
      { type: 'number' }
    ]);
    // Registrations from one document must not affect a separate document.
    const otherSchemas: Record<string, SchemaObject> = {};
    factory.createFromModel(
      [
        { in: 'body', name: 'payload', standardSchema: standardSchema('Union') }
      ],
      otherSchemas
    );
    expect(otherSchemas.Union).toEqual({ type: 'boolean' });
  });

  it.each(['oneOf', 'anyOf', 'allOf'] as const)(
    'uses a compatible nullable wrapper for raw %s response references',
    (combinator) => {
      @ApiSchema({ [combinator]: [{ type: 'string' }] })
      class RawSchema {}
      const factory = new ResponseObjectFactory();
      for (const isArray of [false, true]) {
        const schemas: Record<string, SchemaObject> = {};
        const result = factory.create(
          {
            type: RawSchema,
            nullable: true,
            isArray,
            description: 'OK',
            example: null
          },
          ['application/json'],
          schemas,
          responseFactories
        );
        const reference = { $ref: '#/components/schemas/RawSchema' };
        expect(result.content['application/json']).toEqual({
          schema: {
            anyOf: [
              isArray ? { type: 'array', items: reference } : reference,
              { enum: [null] }
            ]
          },
          example: null
        });
        expect(result).not.toHaveProperty('nullable');
        expect(schemas.RawSchema).toEqual({
          [combinator]: [{ type: 'string' }]
        });
      }
    }
  );
});

function standardSchema(name: string) {
  const convert = () => ({
    $ref: `#/$defs/${name}`,
    $defs: { [name]: { type: 'boolean' } }
  });
  return {
    '~standard': {
      version: 1 as const,
      vendor: 'test',
      jsonSchema: { input: convert, output: convert }
    }
  };
}

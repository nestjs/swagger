import { ApiExtension, ApiProperty, ApiSchema } from '../../lib/decorators';
import { DECORATORS } from '../../lib/constants';
import { Logger } from '@nestjs/common';
import {
  BaseParameterObject,
  SchemasObject
} from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ParamWithTypeMetadata } from '../../lib/services/parameter-metadata-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { CreateUserDto } from './fixtures/create-user.dto';

describe('SchemaObjectFactory', () => {
  let modelPropertiesAccessor: ModelPropertiesAccessor;
  let swaggerTypesMapper: SwaggerTypesMapper;
  let schemaObjectFactory: SchemaObjectFactory;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
    swaggerTypesMapper = new SwaggerTypesMapper();
    schemaObjectFactory = new SchemaObjectFactory(
      modelPropertiesAccessor,
      swaggerTypesMapper
    );
  });

  describe('exploreModelSchema', () => {
    enum Role {
      Admin = 'admin',
      User = 'user'
    }

    enum Group {
      User = 'user',
      Guest = 'guest',
      Family = 'family',
      Neighboard = 'neighboard'
    }

    enum Ranking {
      First = 1,
      Second = 2,
      Third = 3
    }

    enum HairColour {
      Brown = 'Brown',
      Blond = 'Blond',
      Ginger = 'Ginger'
    }

    class CreatePersonDto {
      @ApiProperty()
      name: string;
      @ApiProperty({ enum: Role, enumName: 'Role' })
      role: Role;
    }

    class Person {
      @ApiProperty({ enum: Role, enumName: 'Role' })
      role: Role;

      @ApiProperty({ enum: Role, enumName: 'Role', isArray: true })
      roles: Role[];

      @ApiProperty({ enum: Group, enumName: 'Group', isArray: true })
      groups: Group[];

      @ApiProperty({ enum: Ranking, enumName: 'Ranking', isArray: true })
      rankings: Ranking[];

      @ApiProperty({ enum: () => HairColour, enumName: 'HairColour' })
      hairColour: HairColour;

      @ApiProperty({
        enum: () => ['Pizza', 'Burger', 'Salad'],
        enumName: 'Food',
        isArray: true
      })
      favouriteFoods: string[];
    }

    it('should explore enum', () => {
      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(Person, schemas);

      expect(Object.keys(schemas)).toHaveLength(6);

      expect(schemas).toHaveProperty('Role');
      expect(schemas.Role).toEqual({
        type: 'string',
        enum: ['admin', 'user']
      });
      expect(schemas.Group).toEqual({
        type: 'string',
        enum: ['user', 'guest', 'family', 'neighboard']
      });
      expect(schemas.Ranking).toEqual({
        type: 'number',
        enum: [1, 2, 3]
      });
      expect(schemas.HairColour).toEqual({
        type: 'string',
        enum: ['Brown', 'Blond', 'Ginger']
      });
      expect(schemas).toHaveProperty('Person');
      expect(schemas.Person).toEqual({
        type: 'object',
        properties: {
          role: {
            allOf: [
              {
                $ref: '#/components/schemas/Role'
              }
            ]
          },
          roles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Role'
            }
          },
          groups: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Group'
            }
          },
          rankings: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Ranking'
            }
          },
          favouriteFoods: {
            items: {
              $ref: '#/components/schemas/Food'
            },
            type: 'array'
          },
          hairColour: {
            allOf: [
              {
                $ref: '#/components/schemas/HairColour'
              }
            ]
          }
        },
        required: [
          'role',
          'roles',
          'groups',
          'rankings',
          'hairColour',
          'favouriteFoods'
        ]
      });
      schemaObjectFactory.exploreModelSchema(CreatePersonDto, schemas);

      expect(Object.keys(schemas)).toHaveLength(7);
      expect(schemas).toHaveProperty('CreatePersonDto');
      expect(schemas.CreatePersonDto).toEqual({
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          role: {
            allOf: [
              {
                $ref: '#/components/schemas/Role'
              }
            ]
          }
        },
        required: ['name', 'role']
      });
    });

    it('should merge array enum metadata without keeping a top-level enum', () => {
      class ValidationShimArrayEnumDto {
        @ApiProperty({ enum: Role, isArray: true })
        roles: Role[];

        static _OPENAPI_METADATA_FACTORY() {
          return {
            roles: {
              enum: Role,
              isArray: true
            }
          };
        }
      }
      const schemas: Record<string, SchemasObject> = {};

      schemaObjectFactory.exploreModelSchema(
        ValidationShimArrayEnumDto,
        schemas
      );

      expect(schemas.ValidationShimArrayEnumDto).toEqual({
        type: 'object',
        properties: {
          roles: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['admin', 'user']
            }
          }
        },
        required: ['roles']
      });
    });
    
    it('should support enumName with oneOf', () => {
      enum Status {
        Active = 'active',
        Inactive = 'inactive'
      }

      class DtoWithEnumOneOf {
        @ApiProperty({
          oneOf: [{ type: 'string' }],
          enum: Status,
          enumName: 'Status'
        })
        status: Status | string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(DtoWithEnumOneOf, schemas);

      expect(schemas).toHaveProperty('Status');
      expect(schemas.Status).toEqual({
        type: 'string',
        enum: ['active', 'inactive']
      });
      expect(schemas.DtoWithEnumOneOf.properties.status).toEqual({
        oneOf: [
          { type: 'string' },
          { $ref: '#/components/schemas/Status' }
        ]
      });
      expect(
        schemas.DtoWithEnumOneOf.properties.status
      ).not.toHaveProperty('allOf');
    });

    it('should log a warning when detecting duplicate DTOs with different schemas', () => {
      const loggerWarnSpy = vi
        .spyOn(Logger, 'warn')
        .mockImplementation(() => {});
      const schemas: Record<string, SchemasObject> = {};

      class DuplicateDTO {
        @ApiProperty()
        property1: string;
      }

      schemaObjectFactory.exploreModelSchema(DuplicateDTO, schemas);

      class DuplicateDTOWithDifferentSchema {
        @ApiProperty()
        property2: string;
      }

      Object.defineProperty(DuplicateDTOWithDifferentSchema, 'name', {
        value: 'DuplicateDTO'
      });

      schemaObjectFactory.exploreModelSchema(
        DuplicateDTOWithDifferentSchema,
        schemas
      );

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Duplicate DTO detected: "DuplicateDTO" is defined multiple times with different schemas.\n` +
          `Consider using unique class names or applying @ApiExtraModels() decorator with custom schema names.\n` +
          `Note: This will throw an error in the next major version.`
      );

      loggerWarnSpy.mockRestore();
    });

    it('should not log an error when detecting duplicate DTOs with different schemas', () => {
      const loggerErrorSpy = vi
        .spyOn(Logger, 'error')
        .mockImplementation(() => {});
      const loggerWarnSpy = vi
        .spyOn(Logger, 'warn')
        .mockImplementation(() => {});
      const schemas: Record<string, SchemasObject> = {};

      class DuplicateDTO {
        @ApiProperty()
        property1: string;
      }

      schemaObjectFactory.exploreModelSchema(DuplicateDTO, schemas);

      class DuplicateDTOWithDifferentSchema {
        @ApiProperty()
        property2: string;
      }

      Object.defineProperty(DuplicateDTOWithDifferentSchema, 'name', {
        value: 'DuplicateDTO'
      });

      schemaObjectFactory.exploreModelSchema(
        DuplicateDTOWithDifferentSchema,
        schemas
      );

      expect(loggerErrorSpy).not.toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
      loggerWarnSpy.mockRestore();
    });

    it('should not log a warning when detecting duplicate DTOs with the same schemas', () => {
      const loggerWarnSpy = vi
        .spyOn(Logger, 'warn')
        .mockImplementation(() => {});
      const schemas: Record<string, SchemasObject> = {};

      class DuplicateDTO {
        @ApiProperty()
        property1: string;
      }

      schemaObjectFactory.exploreModelSchema(DuplicateDTO, schemas);

      class DuplicateDTOWithSameSchema {
        @ApiProperty()
        property1: string;
      }

      Object.defineProperty(DuplicateDTOWithSameSchema, 'name', {
        value: 'DuplicateDTO'
      });

      schemaObjectFactory.exploreModelSchema(
        DuplicateDTOWithSameSchema,
        schemas
      );

      expect(loggerWarnSpy).not.toHaveBeenCalled();

      loggerWarnSpy.mockRestore();
    });

    it('should create openapi schema', () => {
      const schemas: Record<string, SchemasObject> = {};
      const schemaKey = schemaObjectFactory.exploreModelSchema(
        CreateUserDto,
        schemas
      );

      expect(schemas[schemaKey]).toEqual({
        type: 'object',
        properties: {
          login: {
            type: 'string'
          },
          password: {
            type: 'string',
            example: 'password123'
          },
          houses: {
            items: {
              $ref: '#/components/schemas/House'
            },
            type: 'array'
          },
          age: {
            type: 'number',
            format: 'int64',
            example: 10
          },
          amount: {
            type: 'integer',
            format: 'int64'
          },
          createdAt: {
            format: 'date-time',
            type: 'string'
          },
          custom: {
            readOnly: true,
            type: 'array',
            maxItems: 10,
            minItems: 1,
            items: {
              type: 'array',
              items: {
                type: 'number'
              }
            }
          },
          profile: {
            description: 'Profile',
            nullable: true,
            type: 'object',
            allOf: [
              {
                $ref: '#/components/schemas/CreateProfileDto'
              }
            ]
          },
          tags: {
            items: {
              type: 'string'
            },
            type: 'array'
          },
          twoDimensionPrimitives: {
            items: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            type: 'array'
          },
          twoDimensionModels: {
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CreateProfileDto'
              }
            },
            type: 'array'
          },
          urls: {
            items: {
              format: 'uri',
              type: 'string'
            },
            type: 'array'
          },
          luckyNumbers: {
            type: 'array',
            items: {
              type: 'integer'
            }
          },
          options: {
            items: {
              properties: {
                isReadonly: {
                  type: 'string'
                }
              },
              type: 'object'
            },
            type: 'array'
          },
          allOf: {
            oneOf: [
              { $ref: '#/components/schemas/Cat' },
              { $ref: '#/components/schemas/Dog' }
            ],
            discriminator: { propertyName: 'pet_type' }
          },
          formatArray: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        required: [
          'login',
          'password',
          'profile',
          'tags',
          'twoDimensionPrimitives',
          'twoDimensionModels',
          'urls',
          'luckyNumbers',
          'options',
          'allOf',
          'houses',
          'createdAt',
          'amount',
          'formatArray'
        ]
      });
      expect(schemas['CreateProfileDto']).toEqual({
        type: 'object',
        properties: {
          firstname: {
            type: 'string'
          },
          lastname: {
            type: 'string'
          },
          parent: {
            $ref: '#/components/schemas/CreateUserDto'
          }
        },
        required: ['firstname', 'lastname', 'parent']
      });
    });

    it('should include type "object" for nullable $ref properties (issue #3274)', () => {
      class ProfileDto {
        @ApiProperty()
        bio: string;
      }

      class UserWithNullableProfile {
        @ApiProperty({
          nullable: true,
          type: () => ProfileDto
        })
        profile: ProfileDto;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(UserWithNullableProfile, schemas);
      expect(
        (schemas['UserWithNullableProfile'] as Record<string, any>).properties
          .profile
      ).toEqual({
        nullable: true,
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ProfileDto' }]
      });
    });

    it('should purge linked types from properties', () => {
      class Human {
        @ApiProperty()
        id: string;

        @ApiProperty({ link: () => Human })
        spouseId: string;
      }

      const schemas: Record<string, SchemasObject> = {};

      schemaObjectFactory.exploreModelSchema(Human, schemas);
      expect(schemas[Human.name]).toEqual({
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          spouseId: {
            type: 'string'
          }
        },
        required: ['id', 'spouseId']
      });
    });

    it('should convert RegExp pattern to string in schema', () => {
      class RegExpPatternDto {
        @ApiProperty({ pattern: /^[+]?abc$/ })
        code: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(RegExpPatternDto, schemas);

      expect(schemas[RegExpPatternDto.name]).toEqual({
        type: 'object',
        properties: {
          code: {
            type: 'string',
            pattern: '^[+]?abc$'
          }
        },
        required: ['code']
      });
    });

    it('should strip flags when converting RegExp pattern', () => {
      class RegExpFlagsDto {
        @ApiProperty({ pattern: /abc/i })
        value: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(RegExpFlagsDto, schemas);

      expect(schemas[RegExpFlagsDto.name]).toEqual({
        type: 'object',
        properties: {
          value: {
            type: 'string',
            pattern: 'abc'
          }
        },
        required: ['value']
      });
    });

    it('should keep string pattern unchanged', () => {
      class StringPatternDto {
        @ApiProperty({ pattern: '^[a-z]+$' })
        slug: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(StringPatternDto, schemas);

      expect(schemas[StringPatternDto.name]).toEqual({
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            pattern: '^[a-z]+$'
          }
        },
        required: ['slug']
      });
    });

    it('should override base class metadata', () => {
      class CreatUserDto {
        @ApiProperty({ minLength: 0, required: true })
        name: string;
      }

      class UpdateUserDto extends CreatUserDto {
        @ApiProperty({ minLength: 1, required: false })
        name: string;
      }

      const schemas: Record<string, SchemasObject> = {};

      schemaObjectFactory.exploreModelSchema(CreatUserDto, schemas);
      schemaObjectFactory.exploreModelSchema(UpdateUserDto, schemas);

      expect(schemas[CreatUserDto.name]).toEqual({
        type: 'object',
        properties: { name: { type: 'string', minLength: 0 } },
        required: ['name']
      });

      expect(schemas[UpdateUserDto.name]).toEqual({
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } }
      });
    });

    describe('@ApiSchema', () => {
      it('should use the class name when no options object was passed', () => {
        @ApiSchema()
        class CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(CreateUserDto, schemas);

        expect(Object.keys(schemas)).toContain('CreateUserDto');
      });

      it('should use the class name when the options object is empty', () => {
        @ApiSchema({})
        class CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(CreateUserDto, schemas);

        expect(Object.keys(schemas)).toContain('CreateUserDto');
      });

      it('should use the schema name instead of class name', () => {
        @ApiSchema({
          name: 'CreateUser'
        })
        class CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(CreateUserDto, schemas);

        expect(Object.keys(schemas)).toContain('CreateUser');
      });

      it('should not use the schema name of the base class', () => {
        @ApiSchema({
          name: 'CreateUser'
        })
        class CreateUserDto {}

        class UpdateUserDto extends CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(UpdateUserDto, schemas);

        expect(Object.keys(schemas)).toContain('UpdateUserDto');
      });

      it('should override the schema name of the base class', () => {
        @ApiSchema({
          name: 'CreateUser'
        })
        class CreateUserDto {}

        @ApiSchema({
          name: 'UpdateUser'
        })
        class UpdateUserDto extends CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(UpdateUserDto, schemas);

        expect(Object.keys(schemas)).toContain('UpdateUser');
      });

      it('should correctly handle recursive schema references in ApiSchema decorator', () => {
        @ApiSchema({ name: 'MenuNode' })
        class MenuNodeDto {
          @ApiProperty({ type: () => MenuNodeDto })
          childNode: MenuNodeDto;
        }

        @ApiSchema({ name: 'Menu' })
        class MenuDto {
          @ApiProperty({ type: () => MenuNodeDto })
          rootNode: MenuNodeDto;
        }

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(MenuDto, schemas);

        expect(schemas['MenuNode'].properties['childNode']['$ref']).toEqual(
          '#/components/schemas/MenuNode'
        );

        expect(schemas['Menu'].properties['rootNode']['$ref']).toEqual(
          '#/components/schemas/MenuNode'
        );
      });

      it('should use the the description if provided', () => {
        @ApiSchema({
          description: 'Represents a user.'
        })
        class CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(CreateUserDto, schemas);

        expect(schemas[CreateUserDto.name].description).toEqual(
          'Represents a user.'
        );
      });

      it('should not use the the description of the base class', () => {
        @ApiSchema({
          description: 'Represents a user.'
        })
        class CreateUserDto {}

        @ApiSchema({
          description: 'Represents a user update.'
        })
        class UpdateUserDto extends CreateUserDto {}

        const schemas: Record<string, SchemasObject> = {};

        schemaObjectFactory.exploreModelSchema(UpdateUserDto, schemas);

        expect(schemas[UpdateUserDto.name].description).toEqual(
          'Represents a user update.'
        );
      });
    });

    it('should include extension properties', () => {
      @ApiExtension('x-test', 'value')
      class CreatUserDto {
        @ApiProperty({ minLength: 0, required: true })
        name: string;
      }

      const schemas: Record<string, SchemasObject> = {};

      schemaObjectFactory.exploreModelSchema(CreatUserDto, schemas);

      expect(schemas[CreatUserDto.name]['x-test']).toEqual('value');
    });

    it('should create arrays of objects', () => {
      class ObjectDto {
        @ApiProperty()
        field: string;
      }

      class TestDto {
        @ApiProperty()
        arrayOfStrings: string[];
      }

      class Test2Dto {
        @ApiProperty({
          isArray: true,
          type: ObjectDto
        })
        arrayOfObjects: ObjectDto[];
      }

      const schemas = {};
      schemaObjectFactory.exploreModelSchema(TestDto, schemas);
      schemaObjectFactory.exploreModelSchema(Test2Dto, schemas);

      expect(schemas[TestDto.name]).toEqual({
        type: 'object',
        properties: {
          arrayOfStrings: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        required: ['arrayOfStrings']
      });
      expect(schemas[Test2Dto.name]).toEqual({
        type: 'object',
        properties: {
          arrayOfObjects: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ObjectDto'
            }
          }
        },
        required: ['arrayOfObjects']
      });
    });

    it('should not use undefined enum', () => {
      class TestDto {
        @ApiProperty({
          type: 'string',
          enum: undefined
        })
        testString: string;
      }

      const schemas = {};
      schemaObjectFactory.exploreModelSchema(TestDto, schemas);
      expect(schemas[TestDto.name]).toEqual({
        type: 'object',
        properties: {
          testString: {
            type: 'string'
          }
        },
        required: ['testString']
      });
    });

    it('should not use undefined enum on array', () => {
      class TestDto {
        @ApiProperty({
          type: 'string',
          isArray: true,
          enum: undefined
        })
        testStringArray: string[];
      }

      const schemas = {};
      schemaObjectFactory.exploreModelSchema(TestDto, schemas);
      expect(schemas[TestDto.name]).toEqual({
        type: 'object',
        properties: {
          testStringArray: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        required: ['testStringArray']
      });
    });
  });

  describe('createEnumSchemaType', () => {
    it('should assign schema type correctly if enumName is provided', () => {
      const metadata = {
        type: 'number',
        enum: [1, 2, 3],
        enumName: 'MyEnum',
        isArray: false
      } as const;
      const schemas = {};

      schemaObjectFactory.createEnumSchemaType('field', metadata, schemas);

      expect(schemas).toEqual({ MyEnum: { enum: [1, 2, 3], type: 'number' } });
    });

    it('should add $ref to existing oneOf when enumName is used with oneOf', () => {
      const metadata = {
        type: 'string',
        enum: ['a', 'b', 'c'],
        enumName: 'MyEnum',
        isArray: false,
        oneOf: [{ type: 'number' }]
      } as any;
      const schemas = {};

      const result = schemaObjectFactory.createEnumSchemaType(
        'field',
        metadata,
        schemas
      );

      expect(schemas).toEqual({
        MyEnum: { enum: ['a', 'b', 'c'], type: 'string' }
      });
      expect(result).toEqual(
        expect.objectContaining({
          oneOf: [
            { type: 'number' },
            { $ref: '#/components/schemas/MyEnum' }
          ]
        })
      );
      expect(result).not.toHaveProperty('allOf');
      expect(result).not.toHaveProperty('enum');
      expect(result).not.toHaveProperty('enumName');
      expect(result).not.toHaveProperty('type');
    });

    it('should add $ref to existing anyOf when enumName is used with anyOf', () => {
      const metadata = {
        type: 'string',
        enum: ['x', 'y'],
        enumName: 'MyEnum',
        isArray: false,
        anyOf: [{ type: 'number' }]
      } as any;
      const schemas = {};

      const result = schemaObjectFactory.createEnumSchemaType(
        'field',
        metadata,
        schemas
      );

      expect(schemas).toEqual({
        MyEnum: { enum: ['x', 'y'], type: 'string' }
      });
      expect(result).toEqual(
        expect.objectContaining({
          anyOf: [
            { type: 'number' },
            { $ref: '#/components/schemas/MyEnum' }
          ]
        })
      );
      expect(result).not.toHaveProperty('allOf');
      expect(result).not.toHaveProperty('enum');
      expect(result).not.toHaveProperty('enumName');
    });
  });

  describe('createEnumParam', () => {
    it('should create an enum schema definition', () => {
      const params: ParamWithTypeMetadata & BaseParameterObject = {
        required: true,
        isArray: false,
        enumName: 'MyEnum',
        enum: ['a', 'b', 'c']
      };
      const schemas = {};
      schemaObjectFactory.createEnumParam(params, schemas);

      expect(schemas['MyEnum']).toEqual({
        enum: ['a', 'b', 'c'],
        type: 'string'
      });
    });

    it('should create an enum schema definition for an array', () => {
      const params: ParamWithTypeMetadata & BaseParameterObject = {
        required: true,
        isArray: true,
        enumName: 'MyEnum',
        schema: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['a', 'b', 'c']
          }
        }
      };
      const schemas = {};
      schemaObjectFactory.createEnumParam(params, schemas);

      expect(schemas['MyEnum']).toEqual({
        enum: ['a', 'b', 'c'],
        type: 'string'
      });
    });
  });

  describe('createFromModel', () => {
    it('should preserve parent example when a non-body param property has a DTO type', () => {
      class ChildDto {
        @ApiProperty({ example: 'child DTO example 1' })
        childKey1: string;
        @ApiProperty({ example: 'child DTO example 2' })
        childKey2: string;
      }

      class ParentDto {
        @ApiProperty({ example: 'parent DTO example' })
        parentKey: ChildDto;
      }

      const schemas: Record<string, SchemasObject> = {};

      // Simulate what ParametersMetadataMapper produces for @Query() ParentDto:
      // it expands the DTO into individual properties with their metadata
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: ChildDto,
          name: 'parentKey',
          required: true,
          example: 'parent DTO example'
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(
        queryParams,
        schemas
      );

      expect(result).toHaveLength(1);
      const paramResult = result[0] as any;
      expect(paramResult.name).toBe('parentKey');
      // The parent's example should be preserved in the schema
      expect(paramResult.schema).toBeDefined();
      expect(paramResult.schema.example).toBe('parent DTO example');
      // Should use allOf pattern when extra metadata exists alongside $ref
      expect(paramResult.schema.allOf).toBeDefined();
      expect(paramResult.schema.allOf[0].$ref).toContain('ChildDto');
    });

    it('should not alter schema when no extra schema options exist on param', () => {
      class SimpleChild {
        @ApiProperty()
        value: string;
      }

      class SimpleParent {
        @ApiProperty()
        child: SimpleChild;
      }

      const schemas: Record<string, SchemasObject> = {};

      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: SimpleChild,
          name: 'child',
          required: true
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(
        queryParams,
        schemas
      );

      expect(result).toHaveLength(1);
      const paramResult = result[0] as any;
      // Without extra schema options, should use plain $ref
      expect(paramResult.schema.$ref).toContain('SimpleChild');
      expect(paramResult.schema.allOf).toBeUndefined();
    });

    it('should merge param-level allOf with $ref wrapping and not lose example', () => {
      class TagDto {
        @ApiProperty()
        name: string;
      }

      class FilterDto {
        @ApiProperty()
        value: string;
      }

      const schemas: Record<string, SchemasObject> = {};

      // Simulate @ApiQuery({ name: 'filter', type: FilterDto, example: 'foo',
      //   allOf: [{ $ref: '#/components/schemas/TagDto' }] }) on a @Query() param.
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: FilterDto,
          name: 'filter',
          required: true,
          example: 'foo',
          allOf: [{ $ref: '#/components/schemas/TagDto' }]
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toHaveLength(1);
      const paramResult = result[0] as any;
      // Top-level allOf and example must be moved into schema, not leaked.
      expect(paramResult.allOf).toBeUndefined();
      expect(paramResult.example).toBeUndefined();
      expect(paramResult.schema).toBeDefined();
      expect(paramResult.schema.example).toBe('foo');
      // Both the parameter's allOf entry and the wrapped $ref should be present.
      expect(Array.isArray(paramResult.schema.allOf)).toBe(true);
      expect(paramResult.schema.allOf).toEqual(
        expect.arrayContaining([
          { $ref: '#/components/schemas/TagDto' },
          expect.objectContaining({ $ref: expect.stringContaining('FilterDto') })
        ])
      );
      expect(paramResult.schema.$ref).toBeUndefined();
    });
  });

  describe('transformToArraySchemaProperty', () => {
    it('should preserve items schema when metadata.items is already defined and type is string', () => {
      const metadata = {
        type: 'array',
        isArray: true,
        items: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            enum: ['asc', 'desc']
          }
        },
        example: [{ created_on: 'desc' }],
        required: false
      };

      const result = schemaObjectFactory.transformToArraySchemaProperty(
        metadata as any,
        'sort',
        'array'
      );

      expect(result.items).toEqual({
        type: 'object',
        additionalProperties: {
          type: 'string',
          enum: ['asc', 'desc']
        }
      });
      expect(result.type).toBe('array');
      expect(result.example).toEqual([{ created_on: 'desc' }]);
    });

    it('should use type parameter when metadata.items is not defined', () => {
      const metadata = {
        type: 'array',
        isArray: true,
        required: false
      };

      const result = schemaObjectFactory.transformToArraySchemaProperty(
        metadata as any,
        'items',
        'string'
      );

      expect(result.items).toEqual({ type: 'string' });
      expect(result.type).toBe('array');
    });

    it('should use type object when provided', () => {
      const metadata = {
        type: 'array',
        isArray: true,
        required: false
      };

      const result = schemaObjectFactory.transformToArraySchemaProperty(
        metadata as any,
        'items',
        { type: 'object', properties: { name: { type: 'string' } } }
      );

      expect(result.items).toEqual({
        type: 'object',
        properties: { name: { type: 'string' } }
      });
      expect(result.type).toBe('array');
    });
  });

  describe('boolean enum and explicit type preservation', () => {
    it('should produce type "boolean" with enum [true, false]', () => {
      class BoolEnumDto {
        @ApiProperty({ enum: [true, false] })
        active: boolean;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(BoolEnumDto, schemas);

      expect(schemas.BoolEnumDto).toBeDefined();
      const props = schemas.BoolEnumDto.properties as any;
      expect(props.active).toEqual({
        type: 'boolean',
        enum: [true, false]
      });
    });

    it('should produce type "boolean" with enum [true]', () => {
      class TrueLiteralDto {
        @ApiProperty({ enum: [true] })
        flag: boolean;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(TrueLiteralDto, schemas);

      const props = schemas.TrueLiteralDto.properties as any;
      expect(props.flag).toEqual({
        type: 'boolean',
        enum: [true]
      });
    });

    it('should preserve explicit type when enum is also provided', () => {
      class ExplicitTypeBoolDto {
        @ApiProperty({ type: 'boolean', enum: [true] })
        flag: boolean;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ExplicitTypeBoolDto, schemas);

      const props = schemas.ExplicitTypeBoolDto.properties as any;
      expect(props.flag).toEqual({
        type: 'boolean',
        enum: [true]
      });
    });

    it('should preserve explicit type "string" even when enum values are numbers', () => {
      class ExplicitTypeStringDto {
        @ApiProperty({ type: 'string', enum: [1, 2, 3] })
        code: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ExplicitTypeStringDto, schemas);

      const props = schemas.ExplicitTypeStringDto.properties as any;
      expect(props.code.type).toBe('string');
      expect(props.code.enum).toEqual([1, 2, 3]);
    });

    it('should infer string enum type when plugin metadata falls back to Object', () => {
      class ObjectFallbackMixedEnumDto {
        static _OPENAPI_METADATA_FACTORY() {
          return {
            gender: {
              required: true,
              type: () => Object,
              enum: ['a', 1]
            }
          };
        }
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(
        ObjectFallbackMixedEnumDto,
        schemas
      );

      const props = schemas.ObjectFallbackMixedEnumDto.properties as any;
      expect(props.gender).toEqual({
        type: 'string',
        enum: ['a', 1]
      });
    });

    it('should infer number enum type when plugin metadata falls back to Object', () => {
      class ObjectFallbackNumberEnumDto {
        static _OPENAPI_METADATA_FACTORY() {
          return {
            value: {
              required: true,
              type: () => Object,
              enum: [1, 2]
            }
          };
        }
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(
        ObjectFallbackNumberEnumDto,
        schemas
      );

      const props = schemas.ObjectFallbackNumberEnumDto.properties as any;
      expect(props.value).toEqual({
        type: 'number',
        enum: [1, 2]
      });
    });

    it('should move enum metadata into array items when plugin array metadata falls back to Object', () => {
      class ObjectFallbackArrayEnumDto {
        static _OPENAPI_METADATA_FACTORY() {
          return {
            values: {
              required: true,
              type: () => [Object],
              enum: ['a', 'b'],
              isArray: true
            }
          };
        }
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(
        ObjectFallbackArrayEnumDto,
        schemas
      );

      const props = schemas.ObjectFallbackArrayEnumDto.properties as any;
      expect(props.values).toEqual({
        type: 'array',
        items: {
          type: 'string',
          enum: ['a', 'b']
        }
      });
    });
  });

  describe('SWC const-enum compatibility (issue #3326)', () => {
    // Simulate the `as const` pattern that SWC resolves as the const object for design:type:
    //   export const MyEnum = { FOO: 'FOO', BAR: 'BAR' } as const;
    //   export type MyEnum = (typeof MyEnum)[keyof typeof MyEnum];
    const MyStringEnum = { FOO: 'FOO', BAR: 'BAR' } as const;
    const MyNumericEnum = { ONE: 1, TWO: 2 } as const;

    it('should handle a const-enum object as design:type without throwing circular dependency error', () => {
      // Simulate what SWC emits: design:type is the const object itself
      class SwcDto {
        someEnum: any;
      }
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        { type: MyStringEnum, required: false },
        SwcDto.prototype,
        'someEnum'
      );
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [':someEnum'],
        SwcDto.prototype
      );

      const schemas: Record<string, any> = {};
      expect(() =>
        schemaObjectFactory.exploreModelSchema(SwcDto as any, schemas)
      ).not.toThrow();
    });

    it('should produce an enum schema when design:type is a string const-enum object (SWC behavior)', () => {
      class SwcStringEnumDto {
        status: any;
      }
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        { type: MyStringEnum, required: true },
        SwcStringEnumDto.prototype,
        'status'
      );
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [':status'],
        SwcStringEnumDto.prototype
      );

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(SwcStringEnumDto as any, schemas);

      expect(schemas['SwcStringEnumDto']).toBeDefined();
      const statusProp = schemas['SwcStringEnumDto'].properties['status'];
      expect(statusProp).toBeDefined();
      // Should be treated as an enum, not throw a circular dependency error
      expect(statusProp.type ?? statusProp.allOf).toBeDefined();
    });

    it('should produce an enum schema when design:type is a numeric const-enum object (SWC behavior)', () => {
      class SwcNumericEnumDto {
        rank: any;
      }
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        { type: MyNumericEnum, required: true },
        SwcNumericEnumDto.prototype,
        'rank'
      );
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [':rank'],
        SwcNumericEnumDto.prototype
      );

      const schemas: Record<string, any> = {};
      expect(() =>
        schemaObjectFactory.exploreModelSchema(
          SwcNumericEnumDto as any,
          schemas
        )
      ).not.toThrow();

      expect(schemas['SwcNumericEnumDto']).toBeDefined();
      const rankProp = schemas['SwcNumericEnumDto'].properties['rank'];
      expect(rankProp).toBeDefined();
    });
  });

  describe('circular dependency error message (issue #3655)', () => {
    it('should include the class name chain when a circular dependency is detected', () => {
      // Simulate a circular dependency by providing a lazy type resolver that
      // returns `undefined` — this mirrors the situation where a bidirectional
      // relationship has not been set up with lazy resolvers on both sides.
      class InnerDto {
        child: any;
      }
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        { type: () => undefined, required: true },
        InnerDto.prototype,
        'child'
      );
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [':child'],
        InnerDto.prototype
      );

      class OuterDto {
        inner: InnerDto;
      }
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        { type: () => InnerDto, required: true },
        OuterDto.prototype,
        'inner'
      );
      Reflect.defineMetadata(
        DECORATORS.API_MODEL_PROPERTIES_ARRAY,
        [':inner'],
        OuterDto.prototype
      );

      const schemas: Record<string, any> = {};
      expect(() =>
        schemaObjectFactory.exploreModelSchema(OuterDto as any, schemas)
      ).toThrow(
        /\[OuterDto\] \[InnerDto\] A circular dependency has been detected/
      );
    });
  });

  describe('inherited property type override', () => {
    it('should use the child class type when a property is redeclared in a subclass', () => {
      class InfoPostDTO {
        @ApiProperty()
        name: string;
      }
      class InfoPutDTO extends InfoPostDTO {
        @ApiProperty()
        id: number;
      }
      class EntityPostDTO {
        @ApiProperty()
        id: number;

        @ApiProperty({ type: () => InfoPostDTO })
        info: InfoPostDTO;
      }
      class EntityPutDTO extends EntityPostDTO {
        @ApiProperty({ type: () => InfoPutDTO })
        info: InfoPutDTO;
      }

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(EntityPutDTO as any, schemas);

      const infoProp = schemas['EntityPutDTO'].properties['info'];
      // The child redeclares `info` as InfoPutDTO — its $ref should point to InfoPutDTO
      expect(infoProp.$ref ?? infoProp?.allOf?.[0]?.$ref).toContain(
        'InfoPutDTO'
      );
      expect(infoProp.$ref ?? infoProp?.allOf?.[0]?.$ref).not.toContain(
        'InfoPostDTO'
      );
    });
  });
});

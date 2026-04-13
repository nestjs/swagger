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

    it('should log a warning when detecting duplicate DTOs with different schemas', () => {
      const loggerWarnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
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
          `To suppress this warning, set { ignoreDuplicateSchemas: true } in SwaggerModule.createDocument() options.`
      );

      loggerWarnSpy.mockRestore();
    });

    it('should not log a warning when ignoreDuplicates is set', () => {
      const loggerWarnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
      const schemas: Record<string, SchemasObject> = {};

      class SilentDuplicateDTO {
        @ApiProperty()
        property1: string;
      }

      schemaObjectFactory.setIgnoreDuplicates(true);
      schemaObjectFactory.exploreModelSchema(SilentDuplicateDTO, schemas);

      class SilentDuplicateDTOWithDifferentSchema {
        @ApiProperty()
        property2: string;
      }

      Object.defineProperty(SilentDuplicateDTOWithDifferentSchema, 'name', {
        value: 'SilentDuplicateDTO'
      });

      schemaObjectFactory.exploreModelSchema(
        SilentDuplicateDTOWithDifferentSchema,
        schemas
      );

      expect(loggerWarnSpy).not.toHaveBeenCalled();

      loggerWarnSpy.mockRestore();
      schemaObjectFactory.setIgnoreDuplicates(false);
    });

    it('should not throw an error or log warning when detecting duplicate DTOs with the same schemas', () => {
      const loggerWarnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
      const schemas: Record<string, SchemasObject> = {};

      class DuplicateDTOSameSchema {
        @ApiProperty()
        property1: string;
      }

      schemaObjectFactory.exploreModelSchema(DuplicateDTOSameSchema, schemas);

      class DuplicateDTOWithSameSchema {
        @ApiProperty()
        property1: string;
      }

      Object.defineProperty(DuplicateDTOWithSameSchema, 'name', {
        value: 'DuplicateDTOSameSchema'
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
        schemaObjectFactory.exploreModelSchema(SwcNumericEnumDto as any, schemas)
      ).not.toThrow();

      expect(schemas['SwcNumericEnumDto']).toBeDefined();
      const rankProp = schemas['SwcNumericEnumDto'].properties['rank'];
      expect(rankProp).toBeDefined();
    });
  });
});


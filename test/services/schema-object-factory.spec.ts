import { ApiExtension, ApiProperty } from '../../lib/decorators';
import {
  BaseParameterObject,
  SchemasObject
} from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { CreateUserDto } from './fixtures/create-user.dto';
import { ParamWithTypeMetadata } from '../../lib/services/parameter-metadata-accessor';

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
      Ginger = 'Ginger',
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

      @ApiProperty({ enum: () => ['Pizza', 'Burger', 'Salad'], enumName: 'Food', isArray: true })
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
            $ref: '#/components/schemas/Role'
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
          'favouriteFoods': {
            'items': {
              '$ref': '#/components/schemas/Food'
            },
            'type': 'array'
          },
          'hairColour': {
            '$ref': '#/components/schemas/HairColour'
          }
        },
        required: ['role', 'roles', 'groups', 'rankings', 'hairColour', 'favouriteFoods']
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
            $ref: '#/components/schemas/Role'
          }
        },
        required: ['name', 'role']
      });
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
          'amount'
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
  });

  describe('createEnumSchemaType', () => {
    it('should assign schema type correctly if enumName is provided', () => {
      const metadata = {
        type: 'number',
        enum: [1, 2, 3],
        enumName: 'MyEnum',
        isArray: false
      };
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
});

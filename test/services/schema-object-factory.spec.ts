import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
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

    class CreatePersonDto {
      @ApiProperty()
      name: string;
      @ApiProperty({ enum: Role, enumName: 'Role' })
      role: Role;
    }

    class Person {
      @ApiProperty({ enum: Role, enumName: 'Role' })
      role: Role;
    }

    it('should explore enum', () => {
      const schemas = [];
      schemaObjectFactory.exploreModelSchema(Person, schemas);

      expect(schemas).toHaveLength(2);

      expect(schemas[0]['Role']).toBeDefined();
      expect(schemas[0]['Role']).toEqual({
        type: 'string',
        enum: ['admin', 'user']
      });
      expect(schemas[1]['Person']).toBeDefined();
      expect(schemas[1]['Person']).toEqual({
        type: 'object',
        properties: {
          role: {
            $ref: '#/components/schemas/Role'
          }
        },
        required: ['role']
      });

      schemaObjectFactory.exploreModelSchema(CreatePersonDto, schemas, [
        'Person',
        'Role'
      ]);

      expect(schemas).toHaveLength(3);
      expect(schemas[2]['CreatePersonDto']).toBeDefined();
      expect(schemas[2]['CreatePersonDto']).toEqual({
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
      const schemas = [];
      const schemaKey = schemaObjectFactory.exploreModelSchema(
        CreateUserDto,
        schemas
      );

      expect(schemas[1][schemaKey]).toEqual({
        type: 'object',
        properties: {
          login: {
            type: 'string'
          },
          password: {
            type: 'string',
            examples: ['test', 'test2']
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
            allOf: [
              {
                $ref: '#/components/schemas/CreateProfileDto'
              },
              {
                description: 'Profile'
              }
            ]
          },
          tags: {
            items: {
              type: 'string'
            },
            type: 'array'
          },
          urls: {
            items: {
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
          'urls',
          'luckyNumbers',
          'options',
          'allOf',
          'houses',
          'createdAt'
        ]
      });
      expect(schemas[2]['CreateProfileDto']).toEqual({
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

      const schemas = [];

      schemaObjectFactory.exploreModelSchema(CreatUserDto, schemas);
      schemaObjectFactory.exploreModelSchema(UpdateUserDto, schemas);

      expect(schemas[0][CreatUserDto.name]).toEqual({
        type: 'object',
        properties: { name: { type: 'string', minLength: 0 } },
        required: ['name']
      });

      expect(schemas[1][UpdateUserDto.name]).toEqual({
        type: 'object',
        properties: { name: { type: 'string', minLength: 1 } }
      });
    });
  });
});

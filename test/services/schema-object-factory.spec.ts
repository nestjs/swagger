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
      @ApiProperty({ enum: () => Role })
      role: Role;
    }

    class Person {
      @ApiProperty({ enum: () => Role })
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
            $ref: '#/components/schemas/CreateProfileDto'
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
          'options',
          'allOf',
          'houses'
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
  });
});

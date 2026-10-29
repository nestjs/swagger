import { Logger, Type } from '@nestjs/common';
import type { BaseIssue, BaseSchema } from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { z, type ZodType } from 'zod';
import { createSchema } from 'zod-openapi';
import { DECORATORS } from '../../lib/constants';
import {
  ApiExtension,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema
} from '../../lib/decorators';
import { StandardSchemaConverter } from '../../lib/interfaces';
import {
  BaseParameterObject,
  ReferenceObject,
  SchemaObject,
  SchemasObject
} from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ParametersMetadataMapper } from '../../lib/services/parameters-metadata-mapper';
import { ParamWithTypeMetadata } from '../../lib/services/parameter-metadata-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import {
  DeepPartialType,
  IntersectionType,
  OmitType,
  PartialType,
  PickType
} from '../../lib/type-helpers';
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
      swaggerTypesMapper,
      testStandardSchemaConverter
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

    it('should convert zod standard schemas into an OpenAPI override', () => {
      class QueryDto {
        value: number;
      }

      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: QueryDto,
          name: 'filter',
          required: true,
          standardSchema: z.object({
            value: z.string(),
            tags: z.array(z.number())
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'filter',
          required: true,
          schema: expect.objectContaining({
            type: 'object',
            properties: {
              value: { type: 'string' },
              tags: {
                type: 'array',
                items: { type: 'number' }
              }
            },
            required: ['value', 'tags']
          })
        })
      ]);
    });

    it('should preserve OpenAPI metadata on zod overrides', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: String,
          name: 'filter',
          required: true,
          standardSchema: z.string().meta({
            description: 'filter description',
            example: 'cats'
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          schema: {
            type: 'string',
            description: 'filter description',
            example: 'cats'
          }
        })
      ]);
    });

    it('should preserve zod unions, enums, and nested OpenAPI metadata on overrides', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          name: 'filter',
          type: Object,
          required: true,
          standardSchema: z.object({
            species: z.enum(['cat', 'dog']).meta({
              title: 'Species',
              description: 'Species enum from Zod',
              example: 'cat'
            }),
            contact: z
              .union([
                z.string().email(),
                z.object({
                  phone: z.string().meta({
                    description: 'Phone number from Zod',
                    example: '123-456'
                  })
                })
              ])
              .meta({
                title: 'PreferredContact',
                description: 'Preferred contact from Zod',
                examples: ['owner@example.com']
              }),
            profile: z
              .object({
                nickname: z.string().meta({
                  description: 'Nested nickname from Zod',
                  example: 'Captain Whiskers'
                })
              })
              .meta({
                title: 'CatProfile',
                description: 'Nested cat profile from Zod'
              })
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);
      const parameter = result[0] as any;

      expect(parameter.schema.properties.species).toEqual({
        type: 'string',
        enum: ['cat', 'dog'],
        title: 'Species',
        description: 'Species enum from Zod',
        example: 'cat'
      });
      expect(parameter.schema.properties.contact).toEqual(
        expect.objectContaining({
          title: 'PreferredContact',
          description: 'Preferred contact from Zod'
        })
      );
      expect(parameter.schema.properties.profile).toEqual(
        expect.objectContaining({
          title: 'CatProfile',
          description: 'Nested cat profile from Zod',
          properties: expect.objectContaining({
            nickname: {
              type: 'string',
              description: 'Nested nickname from Zod',
              example: 'Captain Whiskers'
            }
          })
        })
      );
    });

    it('should convert valibot standard schemas into query properties', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: v.object({
            page: v.number(),
            search: v.optional(v.string())
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'page',
          required: true,
          schema: { type: 'number' }
        }),
        expect.objectContaining({
          in: 'query',
          name: 'search',
          required: false,
          schema: { type: 'string' }
        })
      ]);
    });

    it('should preserve OpenAPI metadata on valibot overrides', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: v.object({
            name: v.pipe(v.string(), v.description('cat name')),
            search: v.pipe(v.optional(v.string()), v.title('Search term'))
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          name: 'name',
          required: true,
          schema: { type: 'string', description: 'cat name' }
        }),
        expect.objectContaining({
          name: 'search',
          required: false,
          schema: { type: 'string', title: 'Search term' }
        })
      ]);
    });

    it('should expand valibot unions, enums, and nested metadata into query parameters', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: v.object({
            mode: v.pipe(
              v.picklist(['simple', 'advanced']),
              v.description('Mode enum from Valibot'),
              v.examples(['simple'])
            ),
            filter: v.pipe(
              v.union([
                v.string(),
                v.object({
                  nested: v.pipe(
                    v.string(),
                    v.description('Nested filter from Valibot'),
                    v.examples(['persian'])
                  )
                })
              ]),
              v.title('FilterTitle'),
              v.description('Filter union from Valibot')
            ),
            details: v.pipe(
              v.object({
                label: v.pipe(
                  v.string(),
                  v.description('Nested label from Valibot'),
                  v.examples(['primary'])
                )
              }),
              v.title('Details title from Valibot'),
              v.description('Nested details from Valibot')
            )
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);
      const mode = result.find(
        (parameter: any) => parameter.name === 'mode'
      ) as any;
      const filter = result.find(
        (parameter: any) => parameter.name === 'filter'
      ) as any;
      const details = result.find(
        (parameter: any) => parameter.name === 'details'
      ) as any;

      expect(mode.schema).toEqual(
        expect.objectContaining({
          type: 'string',
          enum: ['simple', 'advanced'],
          description: 'Mode enum from Valibot'
        })
      );
      expect((mode.schema.examples ?? [mode.schema.example])[0]).toBe('simple');
      expect(filter.schema).toEqual(
        expect.objectContaining({
          title: 'FilterTitle',
          description: 'Filter union from Valibot'
        })
      );
      expect(details.schema).toEqual(
        expect.objectContaining({
          type: 'object',
          title: 'Details title from Valibot',
          description: 'Nested details from Valibot',
          properties: expect.objectContaining({
            label: expect.objectContaining({
              type: 'string',
              description: 'Nested label from Valibot'
            })
          })
        })
      );
    });

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
      expect(
        (schemas.DtoWithEnumOneOf as SchemaObject).properties?.status
      ).toEqual({
        oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Status' }]
      });
      expect(
        (schemas.DtoWithEnumOneOf as SchemaObject).properties?.status
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

    it('should keep inline PickType schemas distinct', () => {
      class ActivityContentDto {
        @ApiProperty()
        title: string;

        @ApiProperty()
        description: string;

        @ApiProperty({ isArray: true, type: String })
        categories: string[];
      }

      class UserDto {
        @ApiProperty()
        id: string;

        @ApiProperty()
        name: string;
      }

      class ActivityResponseDto {
        @ApiProperty({
          type: PickType(ActivityContentDto, [
            'title',
            'description',
            'categories'
          ])
        })
        content: Pick<
          ActivityContentDto,
          'title' | 'description' | 'categories'
        >;

        @ApiProperty({ type: PickType(UserDto, ['id', 'name']) })
        organizer: Pick<UserDto, 'id' | 'name'>;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ActivityResponseDto, schemas);

      expect(schemas.ActivityResponseDto).toEqual({
        type: 'object',
        properties: {
          content: {
            $ref: '#/components/schemas/PickActivityContentDtoTitleDescriptionCategories'
          },
          organizer: {
            $ref: '#/components/schemas/PickUserDtoIdName'
          }
        },
        required: ['content', 'organizer']
      });
      expect(schemas.PickActivityContentDtoTitleDescriptionCategories).toEqual({
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['title', 'description', 'categories']
      });
      expect(schemas.PickUserDtoIdName).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['id', 'name']
      });
    });

    it('should keep inline OmitType schemas distinct', () => {
      class ActivityContentDto {
        @ApiProperty()
        title: string;

        @ApiProperty()
        description: string;

        @ApiProperty({ isArray: true, type: String })
        categories: string[];
      }

      class UserDto {
        @ApiProperty()
        id: string;

        @ApiProperty()
        name: string;
      }

      class ActivityResponseDto {
        @ApiProperty({ type: OmitType(ActivityContentDto, ['description']) })
        content: Omit<ActivityContentDto, 'description'>;

        @ApiProperty({ type: OmitType(UserDto, ['name']) })
        organizer: Omit<UserDto, 'name'>;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ActivityResponseDto, schemas);

      expect(schemas.ActivityResponseDto.properties).toEqual({
        content: {
          $ref: '#/components/schemas/OmitActivityContentDtoDescription'
        },
        organizer: { $ref: '#/components/schemas/OmitUserDtoName' }
      });
      expect(schemas.OmitActivityContentDtoDescription).toEqual({
        type: 'object',
        properties: {
          title: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['title', 'categories']
      });
      expect(schemas.OmitUserDtoName).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      });
    });

    it('should keep inline PartialType schemas distinct', () => {
      class ActivityContentDto {
        @ApiProperty()
        title: string;

        @ApiProperty({ isArray: true, type: String })
        categories: string[];
      }

      class UserDto {
        @ApiProperty()
        id: string;

        @ApiProperty()
        name: string;
      }

      class ActivityResponseDto {
        @ApiProperty({ type: PartialType(ActivityContentDto) })
        content: Partial<ActivityContentDto>;

        @ApiProperty({ type: PartialType(UserDto) })
        organizer: Partial<UserDto>;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ActivityResponseDto, schemas);

      expect(schemas.ActivityResponseDto.properties).toEqual({
        content: { $ref: '#/components/schemas/PartialActivityContentDto' },
        organizer: { $ref: '#/components/schemas/PartialUserDto' }
      });
      expect(schemas.PartialActivityContentDto).toEqual({
        type: 'object',
        properties: {
          title: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      });
      expect(schemas.PartialUserDto).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      });
    });

    it('should keep nested DeepPartialType schemas distinct', () => {
      class OwnerDto {
        @ApiProperty()
        name: string;

        @ApiProperty()
        email: string;
      }

      class AddressDto {
        @ApiProperty()
        street: string;

        @ApiProperty()
        city: string;
      }

      class CreateCatDto {
        @ApiProperty()
        name: string;

        @ApiProperty({ type: () => OwnerDto })
        owner: OwnerDto;

        @ApiProperty({ type: () => AddressDto })
        address: AddressDto;
      }

      class UpdateCatDto extends DeepPartialType(CreateCatDto) {}

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(UpdateCatDto, schemas);

      expect(Object.keys(schemas).sort()).toEqual([
        'DeepPartialAddressDto',
        'DeepPartialOwnerDto',
        'UpdateCatDto'
      ]);
      expect(schemas.UpdateCatDto.properties).toEqual({
        name: { type: 'string' },
        owner: { $ref: '#/components/schemas/DeepPartialOwnerDto' },
        address: { $ref: '#/components/schemas/DeepPartialAddressDto' }
      });
      expect(schemas.DeepPartialOwnerDto).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      });
      expect(schemas.DeepPartialAddressDto).toEqual({
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' }
        }
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

    it('should drop inferred type for nullable oneOf properties (issue #3928)', () => {
      class DtoWithNullablePrimitiveUnion {
        @ApiProperty({
          oneOf: [{ type: 'string' }, { type: 'number' }],
          nullable: true
        })
        value: string | number | null;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(
        DtoWithNullablePrimitiveUnion,
        schemas
      );

      expect(
        (schemas['DtoWithNullablePrimitiveUnion'] as Record<string, any>)
          .properties.value
      ).toEqual({
        nullable: true,
        oneOf: [{ type: 'string' }, { type: 'number' }]
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

    it('should keep a user-defined allOf on a model-typed property', () => {
      class AllOfNestedDto {
        @ApiProperty()
        a: string;
      }
      class AllOfHolderDto {
        @ApiProperty({ type: AllOfNestedDto, allOf: [{ required: ['a'] }] })
        nested: AllOfNestedDto;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(AllOfHolderDto, schemas);

      expect(schemas[AllOfHolderDto.name].properties!.nested).toEqual({
        allOf: [
          { required: ['a'] },
          { $ref: '#/components/schemas/AllOfNestedDto' }
        ]
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

    it('should resolve nested array type to the correct leaf type', () => {
      class NestedArrayDto {
        @ApiProperty({ type: [[String]] } as any)
        matrix: string[][];
      }

      const schemas = {};
      schemaObjectFactory.exploreModelSchema(NestedArrayDto, schemas);
      expect(schemas[NestedArrayDto.name]).toEqual({
        type: 'object',
        properties: {
          matrix: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        required: ['matrix']
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
          oneOf: [{ type: 'number' }, { $ref: '#/components/schemas/MyEnum' }]
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
          anyOf: [{ type: 'number' }, { $ref: '#/components/schemas/MyEnum' }]
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
    it('should override an inferred named query type with a standard schema', () => {
      class QueryDto {
        value: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: QueryDto,
          name: 'filter',
          required: true,
          standardSchema: createStandardSchema({
            type: 'string',
            pattern: '^foo'
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
            pattern: '^foo'
          }
        })
      ]);
    });

    it('should promote a standard schema description onto a named parameter', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: String,
          name: 'filter',
          required: true,
          standardSchema: createStandardSchema({
            type: 'string',
            description: 'Filter description from schema'
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      // Swagger UI reads `parameter.description`, not
      // `parameter.schema.description` — a Standard Schema only ever
      // produces the latter, so it must be promoted here.
      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'filter',
          description: 'Filter description from schema',
          schema: {
            type: 'string',
            description: 'Filter description from schema'
          }
        })
      ]);
    });

    it('should not override an explicit parameter description with the schema one', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: String,
          name: 'filter',
          required: true,
          description: 'Explicit decorator description',
          standardSchema: createStandardSchema({
            type: 'string',
            description: 'Filter description from schema'
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'filter',
          description: 'Explicit decorator description',
          schema: {
            type: 'string',
            description: 'Filter description from schema'
          }
        })
      ]);
    });

    it('should override an inferred body type with a standard schema', () => {
      class BodyDto {
        value: number;
      }

      const schemas: Record<string, SchemasObject> = {};
      const bodyParams: ParamWithTypeMetadata[] = [
        {
          in: 'body',
          type: BodyDto,
          required: true,
          standardSchema: z.object({
            value: z.string()
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(bodyParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'body',
          name: 'BodyDto',
          schema: expect.objectContaining({
            type: 'object',
            properties: {
              value: { type: 'string' }
            },
            required: ['value']
          })
        })
      ]);
    });

    it('should expand unnamed query standard schemas into parameter properties', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: createStandardSchema({
            type: 'object',
            required: ['limit'],
            properties: {
              limit: {
                type: 'integer',
                minimum: 1
              },
              search: {
                type: 'string'
              }
            }
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'limit',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          }
        }),
        expect.objectContaining({
          in: 'query',
          name: 'search',
          required: false,
          schema: {
            type: 'string'
          }
        })
      ]);
    });

    it('should promote a standard schema property description onto its expanded parameter', () => {
      const schemas: Record<string, SchemasObject> = {};
      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: createStandardSchema({
            type: 'object',
            required: ['limit'],
            properties: {
              limit: {
                type: 'integer',
                description: 'Limit description from schema'
              },
              search: {
                type: 'string'
              }
            }
          })
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'limit',
          description: 'Limit description from schema',
          schema: {
            type: 'integer',
            description: 'Limit description from schema'
          }
        }),
        expect.objectContaining({
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          }
        })
      ]);
      expect(result[1]).not.toHaveProperty('description');
    });

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

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

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

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

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
          expect.objectContaining({
            $ref: expect.stringContaining('FilterDto')
          })
        ])
      );
      expect(paramResult.schema.$ref).toBeUndefined();
    });

    it('should merge parameter and schema allOf constraints for a named scalar parameter', () => {
      class FilterDto {
        @ApiProperty({ type: String })
        code: string;
      }

      const metadata: ParamWithTypeMetadata &
        Pick<SchemaObject, 'allOf'> & { schema: SchemaObject } = {
        in: 'query',
        name: 'filter',
        type: FilterDto,
        allOf: [{ required: ['code'] }],
        schema: { allOf: [{ minProperties: 1 }] }
      };

      const parameters = schemaObjectFactory.createFromModel([metadata], {});
      const [parameter] = swaggerTypesMapper.mapParamTypes(parameters);

      expect(parameter).not.toHaveProperty('allOf');
      expect(parameter).toHaveProperty('schema', {
        allOf: [
          { minProperties: 1 },
          { required: ['code'] },
          { $ref: '#/components/schemas/FilterDto' }
        ]
      });
    });

    it('should keep array parameter allOf constraints separate from item constraints', () => {
      class FilterDto {
        @ApiProperty({ type: String })
        code: string;
      }

      const metadata: ParamWithTypeMetadata &
        Pick<SchemaObject, 'allOf'> & { schema: SchemaObject } = {
        in: 'query',
        name: 'filters',
        type: FilterDto,
        isArray: true,
        allOf: [{ minItems: 1 }],
        schema: { allOf: [{ required: ['code'] }] }
      };

      const parameters = schemaObjectFactory.createFromModel([metadata], {});
      const [parameter] = swaggerTypesMapper.mapParamTypes(parameters);

      expect(parameter).not.toHaveProperty('allOf');
      expect(parameter).toHaveProperty('schema', {
        type: 'array',
        allOf: [{ minItems: 1 }],
        items: {
          allOf: [
            { required: ['code'] },
            { $ref: '#/components/schemas/FilterDto' }
          ]
        }
      });
    });

    it('should create enum schema for query params using SWC const-enum object metadata', () => {
      const CampaignStatus = {
        ACTIVE: 'active',
        PAUSED: 'paused',
        COMPLETED: 'completed'
      } as const;
      const schemas: Record<string, SchemasObject> = {};

      const queryParams: ParamWithTypeMetadata[] = [
        {
          in: 'query',
          type: CampaignStatus,
          name: 'status',
          required: false
        } as any
      ];

      const result = schemaObjectFactory.createFromModel(queryParams, schemas);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          in: 'query',
          name: 'status',
          required: false,
          schema: {
            type: 'string',
            enum: ['active', 'paused', 'completed']
          },
          selfRequired: false
        })
      );
    });
  });

  function createStandardSchema(schema: Record<string, unknown>) {
    return {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: unknown) => ({ value }),
        jsonSchema: {
          input: () => schema
        }
      }
    };
  }

  const testStandardSchemaConverter: StandardSchemaConverter = (
    schema,
    { schemaType }
  ) => {
    if (isZodStandardSchema(schema)) {
      const converted = createSchema(schema, {
        io: schemaType,
        openapiVersion: '3.0.0'
      });
      return {
        schema: converted.schema as SchemaObject | ReferenceObject,
        components: converted.components as unknown as Record<
          string,
          SchemaObject
        >
      };
    }

    if (isValibotStandardSchema(schema)) {
      return {
        schema: toJsonSchema(schema, {
          target: 'openapi-3.0',
          typeMode: schemaType
        }) as unknown as SchemaObject | ReferenceObject
      };
    }

    return undefined;
  };

  type ValibotSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;

  function hasVendor(schema: unknown, vendor: string) {
    return (
      !!schema &&
      typeof schema === 'object' &&
      (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor ===
        vendor
    );
  }

  function isZodStandardSchema(schema: unknown): schema is ZodType {
    return hasVendor(schema, 'zod');
  }

  function isValibotStandardSchema(schema: unknown): schema is ValibotSchema {
    return hasVendor(schema, 'valibot');
  }

  describe('expandStandardSchemaParam', () => {
    it('should expand an unnamed query standard schema into one param per property', () => {
      const result = schemaObjectFactory.expandStandardSchemaParam(
        {
          in: 'query',
          type: Object,
          required: true,
          standardSchema: createStandardSchema({
            type: 'object',
            required: ['limit'],
            properties: {
              limit: { type: 'integer' },
              search: { type: 'string' }
            }
          })
        } as any,
        {}
      );

      expect(result).toEqual([
        expect.objectContaining({
          in: 'query',
          name: 'limit',
          required: true,
          schema: { type: 'integer' }
        }),
        expect.objectContaining({
          in: 'query',
          name: 'search',
          required: false,
          schema: { type: 'string' }
        })
      ]);
    });

    it('should not expand a body param', () => {
      expect(
        schemaObjectFactory.expandStandardSchemaParam(
          {
            in: 'body',
            type: Object,
            required: true,
            standardSchema: createStandardSchema({
              type: 'object',
              properties: { title: { type: 'string' } }
            })
          } as any,
          {}
        )
      ).toBeUndefined();
    });

    it('should not expand a named query param', () => {
      expect(
        schemaObjectFactory.expandStandardSchemaParam(
          {
            in: 'query',
            name: 'filter',
            type: Object,
            required: false,
            standardSchema: createStandardSchema({
              type: 'object',
              properties: { nested: { type: 'string' } }
            })
          } as any,
          {}
        )
      ).toBeUndefined();
    });

    it('should not expand a standard schema that does not convert to an object schema', () => {
      expect(
        schemaObjectFactory.expandStandardSchemaParam(
          {
            in: 'query',
            type: Object,
            required: false,
            standardSchema: createStandardSchema({
              oneOf: [{ type: 'string' }, { type: 'number' }]
            })
          } as any,
          {}
        )
      ).toBeUndefined();
    });

    it('should not invoke the converter for params it cannot expand', () => {
      const converter = vi.fn(() => undefined);
      const factory = new SchemaObjectFactory(
        modelPropertiesAccessor,
        swaggerTypesMapper,
        converter as any
      );

      factory.expandStandardSchemaParam(
        {
          in: 'body',
          type: Object,
          required: true,
          standardSchema: createStandardSchema({ type: 'object' })
        } as any,
        {}
      );
      factory.expandStandardSchemaParam(
        {
          in: 'query',
          name: 'filter',
          type: Object,
          required: false,
          standardSchema: createStandardSchema({ type: 'object' })
        } as any,
        {}
      );

      expect(converter).not.toHaveBeenCalled();
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

  describe('inherited property required override', () => {
    const requiredOf = (type: Type<unknown>) => {
      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(type, schemas);
      return schemas[type.name].required ?? [];
    };

    it('should make a property required when a subclass re-declares an optional one with a bare @ApiProperty()', () => {
      class ParentWithOptionalName {
        @ApiPropertyOptional({ description: 'Display name', example: 'Ada' })
        name?: string;
      }
      class ChildWithRequiredName extends ParentWithOptionalName {
        @ApiProperty()
        override name!: string;
      }

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(ChildWithRequiredName, schemas);
      schemaObjectFactory.exploreModelSchema(ParentWithOptionalName, schemas);

      expect(schemas['ChildWithRequiredName'].required).toEqual(['name']);
      // The other inherited options are kept; only `required` falls back to the default.
      expect(schemas['ChildWithRequiredName'].properties.name).toEqual({
        type: 'string',
        description: 'Display name',
        example: 'Ada'
      });
      expect(schemas['ParentWithOptionalName'].required).toBeUndefined();
    });

    it('should keep the property optional when the subclass says so', () => {
      class ParentWithRequiredName {
        @ApiProperty()
        name: string;
      }
      class ChildWithOptionalDecorator extends ParentWithRequiredName {
        @ApiPropertyOptional()
        override name: string;
      }
      class ChildWithExplicitRequiredFalse extends ParentWithRequiredName {
        @ApiProperty({ required: false })
        override name: string;
      }

      expect(requiredOf(ChildWithOptionalDecorator)).toEqual([]);
      expect(requiredOf(ChildWithExplicitRequiredFalse)).toEqual([]);
    });

    it('should keep inheriting required: false when the subclass does not re-declare the property', () => {
      class ParentWithOptionalName {
        @ApiPropertyOptional()
        name?: string;
      }
      class ChildWithOwnProperty extends ParentWithOptionalName {
        @ApiProperty()
        id: number;
      }

      expect(requiredOf(ChildWithOwnProperty)).toEqual(['id']);
    });

    it('should apply through more than one level of inheritance', () => {
      class GrandparentWithOptionalName {
        @ApiPropertyOptional()
        name?: string;
      }
      class ParentWithoutRedeclaration extends GrandparentWithOptionalName {}
      class ChildWithRequiredName extends ParentWithoutRedeclaration {
        @ApiProperty()
        override name!: string;
      }
      class GrandchildWithOptionalName extends ChildWithRequiredName {
        @ApiPropertyOptional()
        override name!: string;
      }

      expect(requiredOf(ParentWithoutRedeclaration)).toEqual([]);
      expect(requiredOf(ChildWithRequiredName)).toEqual(['name']);
      expect(requiredOf(GrandchildWithOptionalName)).toEqual([]);
    });

    it('should not change how decorators stacked on the same class are merged', () => {
      class StackedDecorators {
        @ApiProperty({ description: 'Display name' })
        @ApiPropertyOptional()
        name?: string;
      }

      expect(requiredOf(StackedDecorators)).toEqual([]);
    });

    it('should also apply when the CLI plugin metadata describes the subclass', () => {
      class PluginParent {
        @ApiPropertyOptional()
        name?: string;
      }
      class PluginChild extends PluginParent {
        @ApiProperty({ description: 'Display name' })
        override name!: string;

        static _OPENAPI_METADATA_FACTORY() {
          return { name: { required: true, type: () => String } };
        }
      }

      expect(requiredOf(PluginChild)).toEqual(['name']);
    });

    it("should keep the parent's explicit decorator over CLI plugin metadata when the subclass has no decorator", () => {
      class PluginParentWithOptionalName {
        @ApiPropertyOptional()
        name?: string;
      }
      class PluginChildWithoutDecorator extends PluginParentWithOptionalName {
        override name!: string;

        static _OPENAPI_METADATA_FACTORY() {
          return { name: { required: true, type: () => String } };
        }
      }

      expect(requiredOf(PluginChildWithoutDecorator)).toEqual([]);
    });
  });

  describe('Record/additionalProperties (plugin output)', () => {
    it('should preserve additionalProperties emitted for Record<string, V>', () => {
      class RecordDto {
        @ApiProperty({
          type: 'object',
          additionalProperties: { type: 'string' }
        })
        attributes: Record<string, string>;
      }

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(RecordDto, schemas);

      expect(schemas['RecordDto'].properties['attributes']).toEqual({
        type: 'object',
        additionalProperties: { type: 'string' }
      });
    });

    it('should preserve additionalProperties: true for Record<string, any>', () => {
      class AnyRecordDto {
        @ApiProperty({ type: 'object', additionalProperties: true })
        attributes: Record<string, any>;
      }

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(AnyRecordDto, schemas);

      expect(schemas['AnyRecordDto'].properties['attributes']).toEqual({
        type: 'object',
        additionalProperties: true
      });
    });

    it('should resolve the flat metadata the CLI plugin generates without a circular dependency', () => {
      class PluginRecordDto {
        @ApiProperty()
        attributes: Record<string, string>;

        static _OPENAPI_METADATA_FACTORY() {
          return {
            attributes: {
              required: true,
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          };
        }
      }

      const schemas: Record<string, any> = {};
      expect(() =>
        schemaObjectFactory.exploreModelSchema(PluginRecordDto, schemas)
      ).not.toThrow();

      expect(schemas['PluginRecordDto'].properties['attributes']).toEqual({
        type: 'object',
        additionalProperties: { type: 'string' }
      });
    });
  });

  describe('lazy enum', () => {
    // Fresh array on each call: an eager call would only see the values registered before the decorator ran
    let registry: string[];
    let numericRegistry: number[];

    const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));

    beforeEach(() => {
      registry = ['first'];
      numericRegistry = [1];
    });

    function defineDto() {
      class LazyEnumDto {
        @ApiProperty({ enum: () => [...registry], enumName: 'LazyEnum' })
        named: string;

        @ApiProperty({ enum: () => [...registry] })
        unnamed: string;

        @ApiProperty({
          enum: () => [...registry],
          enumName: 'LazyArrayEnum',
          isArray: true
        })
        many: string[];

        @ApiProperty({
          enum: () => [...registry],
          enumName: 'TypedLazyEnum',
          type: 'string'
        })
        typed: string;

        @ApiProperty({
          enum: () => [...numericRegistry],
          enumName: 'NumericLazyEnum'
        })
        numeric: number;

        @ApiProperty({
          enum: () => [...registry],
          enumName: 'LazyTypeArrayEnum',
          type: () => [String]
        })
        lazyTypeArray: string[];
      }
      return LazyEnumDto;
    }

    it('should call the enum function when the schema is generated, not when the decorator runs', () => {
      const LazyEnumDto = defineDto();
      registry.push('second');
      numericRegistry.push(2);

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(LazyEnumDto, schemas);
      const serialized = serialize(schemas);

      for (const name of [
        'LazyEnum',
        'LazyArrayEnum',
        'TypedLazyEnum',
        'LazyTypeArrayEnum'
      ]) {
        expect(serialized[name]).toEqual({
          type: 'string',
          enum: ['first', 'second']
        });
      }
      expect(serialized.NumericLazyEnum).toEqual({
        type: 'number',
        enum: [1, 2]
      });
    });

    it('should keep the shape of the generated properties', () => {
      const LazyEnumDto = defineDto();
      registry.push('second');

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(LazyEnumDto, schemas);

      expect(serialize(schemas.LazyEnumDto).properties).toEqual({
        named: { allOf: [{ $ref: '#/components/schemas/LazyEnum' }] },
        unnamed: { type: 'string', enum: ['first', 'second'] },
        many: {
          type: 'array',
          items: { $ref: '#/components/schemas/LazyArrayEnum' }
        },
        typed: { allOf: [{ $ref: '#/components/schemas/TypedLazyEnum' }] },
        numeric: {
          allOf: [{ $ref: '#/components/schemas/NumericLazyEnum' }]
        },
        lazyTypeArray: {
          type: 'array',
          items: { $ref: '#/components/schemas/LazyTypeArrayEnum' }
        }
      });
    });

    it('should not infer the type from the values when it is explicit', () => {
      class ExplicitTypeDto {
        @ApiProperty({ enum: () => [1, 2], type: 'string' })
        value: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ExplicitTypeDto, schemas);

      expect(serialize(schemas.ExplicitTypeDto).properties).toEqual({
        value: { type: 'string', enum: [1, 2] }
      });
    });

    it('should infer the type separately for each property sharing an enum function', () => {
      const sharedEnum = () => [...registry];
      class SharedEnumDto {
        @ApiProperty({ enum: sharedEnum })
        inferred: string;

        @ApiProperty({ enum: sharedEnum, type: 'integer' })
        explicit: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(SharedEnumDto, schemas);

      expect(serialize(schemas.SharedEnumDto).properties).toEqual({
        inferred: { type: 'string', enum: ['first'] },
        explicit: { type: 'integer', enum: ['first'] }
      });
    });

    describe('in a mapped type', () => {
      class BaseDto {
        @ApiProperty({ enum: () => [...registry], enumName: 'MappedEnum' })
        named: string;

        // declared as `string`, but the values are numbers
        @ApiProperty({ enum: () => [...numericRegistry] })
        numeric: string;

        @ApiProperty({ enum: () => [...numericRegistry] })
        untyped: any;
      }

      const mappedTypes: Array<[string, () => Type<any>]> = [
        ['PartialType', () => PartialType(BaseDto)],
        ['PickType', () => PickType(BaseDto, ['named', 'numeric', 'untyped'])],
        ['OmitType', () => OmitType(BaseDto, [])],
        ['IntersectionType', () => IntersectionType(BaseDto, class {})],
        ['DeepPartialType', () => DeepPartialType(BaseDto)]
      ];

      it.each(mappedTypes)(
        'should keep resolving the enums lazily with %s',
        (_name, createMappedType) => {
          const MappedDto = createMappedType();
          registry.push('second');
          numericRegistry.push(2);

          const schemas: Record<string, SchemasObject> = {};
          schemaObjectFactory.exploreModelSchema(MappedDto, schemas);
          const serialized = serialize(schemas);

          expect(serialized.MappedEnum).toEqual({
            type: 'string',
            enum: ['first', 'second']
          });
          const properties = serialized[MappedDto.name].properties;
          expect(properties.named).toEqual({
            allOf: [{ $ref: '#/components/schemas/MappedEnum' }]
          });
          expect(properties.numeric).toEqual({
            type: 'number',
            enum: [1, 2]
          });
          expect(properties.untyped).toEqual({
            type: 'number',
            enum: [1, 2]
          });
        }
      );

      it('should keep resolving the enums lazily in a mapped query DTO', () => {
        const params = new ParametersMetadataMapper(
          modelPropertiesAccessor
        ).transformModelToProperties([
          { in: 'query', type: PartialType(BaseDto) } as any
        ]) as ParamWithTypeMetadata[];
        registry.push('second');
        numericRegistry.push(2);

        const schemas: Record<string, SchemasObject> = {};
        const byName = Object.fromEntries(
          serialize(schemaObjectFactory.createFromModel(params, schemas)).map(
            (param: any) => [param.name, param]
          )
        );

        expect(byName.named.schema).toEqual({
          $ref: '#/components/schemas/MappedEnum'
        });
        expect(byName.numeric).toMatchObject({
          type: 'number',
          enum: [1, 2]
        });
        expect(byName.untyped).toMatchObject({
          type: 'number',
          enum: [1, 2]
        });
        expect(serialize(schemas)).toEqual({
          MappedEnum: { type: 'string', enum: ['first', 'second'] }
        });
      });
    });

    describe('in a query DTO', () => {
      function createParams() {
        class LazyEnumQueryDto {
          @ApiProperty({ enum: () => [...registry], enumName: 'QueryEnum' })
          named: string;

          @ApiProperty({ enum: () => [...registry] })
          unnamed: string;

          @ApiProperty({
            enum: () => [...registry],
            enumName: 'QueryArrayEnum',
            isArray: true
          })
          many: string[];
        }
        const params = new ParametersMetadataMapper(
          modelPropertiesAccessor
        ).transformModelToProperties([
          { in: 'query', type: LazyEnumQueryDto } as any
        ]);
        return params as ParamWithTypeMetadata[];
      }

      it('should resolve the enums when the parameters are generated', () => {
        const params = createParams();
        registry.push('second');

        const schemas: Record<string, SchemasObject> = {};
        const result = serialize(
          schemaObjectFactory.createFromModel(params, schemas)
        );
        const byName = Object.fromEntries(
          result.map((param: any) => [param.name, param])
        );

        expect(byName.named.schema).toEqual({
          $ref: '#/components/schemas/QueryEnum'
        });
        expect(byName.unnamed).toMatchObject({
          type: 'string',
          enum: ['first', 'second']
        });
        expect(byName.many.schema).toEqual({
          type: 'array',
          items: { $ref: '#/components/schemas/QueryArrayEnum' }
        });
        expect(serialize(schemas)).toEqual({
          QueryEnum: { type: 'string', enum: ['first', 'second'] },
          QueryArrayEnum: { type: 'string', enum: ['first', 'second'] }
        });
      });
    });
  });
});

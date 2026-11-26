import { Type } from '@nestjs/common';
import { validate } from 'class-validator';
import { DECORATORS } from '../../lib/constants';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ApiProperty } from '../../lib/decorators';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import {
  DeepPartialType,
  IntersectionType,
  OmitType,
  PartialType,
  PickType
} from '../../lib/type-helpers';
import { CreateUserDto } from './fixtures/create-user-dto.fixture';
import { SERIALIZED_METADATA } from './fixtures/serialized-metadata.fixture';

class UpdateUserDto extends PartialType(CreateUserDto) {}

describe('PartialType', () => {
  const metadataLoader = new MetadataLoader();

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('Validation metadata', () => {
    it('should apply @IsOptional to properties reflected by the plugin', async () => {
      const updateDto = new UpdateUserDto();
      updateDto.firstName = null;
      const validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(0);
    });

    it('should apply @IsOptional to properties reflected by the plugin if option `skipNullProperties` is true', async () => {
      class UpdateUserWithNullableDto extends PartialType(CreateUserDto, {
        skipNullProperties: true
      }) {}
      const updateDto = new UpdateUserWithNullableDto();
      updateDto.firstName = null;
      const validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(0);
    });

    it('should apply @IsOptional to properties reflected by the plugin if option `skipNullProperties` is undefined', async () => {
      class UpdateUserWithoutNullableDto extends PartialType(
        CreateUserDto,
        {}
      ) {}
      const updateDto = new UpdateUserWithoutNullableDto();
      updateDto.firstName = null;
      const validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(0);
    });

    it('should apply @ValidateIf to properties reflected by the plugin if option `skipNullProperties` is false', async () => {
      class UpdateUserWithoutNullableDto extends PartialType(CreateUserDto, {
        skipNullProperties: false
      }) {}
      const updateDto = new UpdateUserWithoutNullableDto();
      updateDto.firstName = null;
      const validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].constraints).toEqual({
        isString: 'firstName must be a string'
      });
    });

    it.each([{}, { skipNullProperties: false }])(
      'should not whitelist documented properties that have no validation decorator (%j)',
      async (options) => {
        class UpdateUserWithOptionsDto extends PartialType(
          CreateUserDto,
          options
        ) {}
        await metadataLoader.load(SERIALIZED_METADATA);

        const updateDto = Object.assign(new UpdateUserWithOptionsDto(), {
          firstName: 'John',
          login: 'admin',
          active: true
        });
        const validationErrors = await validate(updateDto, {
          whitelist: true,
          forbidNonWhitelisted: true
        });
        expect(validationErrors.map((error) => error.property)).toEqual([
          'login',
          'active'
        ]);
      }
    );
  });
  describe('OpenAPI metadata', () => {
    it('should return partial class', async () => {
      await metadataLoader.load(SERIALIZED_METADATA);

      const prototype = UpdateUserDto.prototype as any as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'login',
        'password',
        'firstName',
        'lastName',
        'active',
        'role'
      ]);
    });

    it('should set "required" option to "false" for each property', () => {
      const classRef = UpdateUserDto.prototype as any as Type<any>;
      const keys = modelPropertiesAccessor.getModelProperties(classRef);
      const metadata = keys.map((key) => {
        return Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          classRef,
          key
        );
      });

      expect(metadata[0]).toEqual({
        isArray: false,
        required: false,
        type: String
      });
      expect(metadata[1]).toEqual({
        isArray: false,
        required: false,
        minLength: 10,
        type: String
      });
      expect(metadata[2]).toEqual({
        isArray: false,
        required: false,
        type: String
      });
    });
  });
  describe('Schema', () => {
    const schemaObjectFactory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );

    it('should not turn a type inferred for a property declaring oneOf into an explicit one', () => {
      class NullableBinDto {
        @ApiProperty({
          required: false,
          oneOf: [{ type: 'string' }, { type: 'null' }]
        })
        bin?: string | null;
      }
      class UpdateNullableBinDto extends PartialType(NullableBinDto) {}

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(NullableBinDto, schemas);
      schemaObjectFactory.exploreModelSchema(UpdateNullableBinDto, schemas);

      const oneOf = [{ type: 'string' }, { type: 'null' }];
      expect(schemas.NullableBinDto.properties.bin).toEqual({ oneOf });
      expect(schemas.UpdateNullableBinDto.properties.bin).toEqual({ oneOf });
    });

    it.each([
      ['PickType', (base: Type<any>) => PickType(base, ['bin'])],
      ['OmitType', (base: Type<any>) => OmitType(base, [])],
      ['IntersectionType', (base: Type<any>) => IntersectionType(base, base)]
    ])('should leave the type of a oneOf property inferred in %s', (_, map) => {
      class NullableBinDto {
        @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'null' }] })
        bin: string | null;
      }
      class MappedDto extends (map(NullableBinDto) as Type<any>) {}

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(MappedDto, schemas);

      expect(schemas.MappedDto.properties.bin).toEqual({
        oneOf: [{ type: 'string' }, { type: 'null' }]
      });
    });

    it('should keep a type declared explicitly next to oneOf', () => {
      class ExplicitTypeDto {
        @ApiProperty({
          type: 'string',
          oneOf: [{ maxLength: 3 }, { minLength: 10 }]
        })
        code: string;
      }
      class UpdateExplicitTypeDto extends PartialType(ExplicitTypeDto) {}

      const schemas: Record<string, any> = {};
      schemaObjectFactory.exploreModelSchema(UpdateExplicitTypeDto, schemas);

      expect(schemas.UpdateExplicitTypeDto.properties.code).toEqual({
        type: 'string',
        oneOf: [{ maxLength: 3 }, { minLength: 10 }]
      });
    });

    describe('property re-declared by the parent with CLI plugin metadata', () => {
      const createDtos = () => {
        class ProfileDto {
          static _OPENAPI_METADATA_FACTORY() {
            return {
              displayName: { required: true, type: () => String },
              ssn: { required: false, type: () => String }
            };
          }
        }
        class PublicProfileDto {
          static _OPENAPI_METADATA_FACTORY() {
            return { displayName: { required: true, type: () => String } };
          }
        }
        class UserDto {
          @ApiProperty({ description: 'Contact details' })
          contact: ProfileDto;

          static _OPENAPI_METADATA_FACTORY() {
            return {
              id: { required: true, type: () => Number },
              profile: { required: true, type: () => ProfileDto },
              contact: { required: true, type: () => ProfileDto }
            };
          }
        }
        return { PublicProfileDto, UserDto };
      };
      const publicUserMetadata = (PublicProfileDto: Type<unknown>) => ({
        profile: { required: true, type: () => PublicProfileDto },
        contact: { required: true, type: () => PublicProfileDto }
      });
      const refOf = (property: Record<string, any>) =>
        property.$ref ?? property.allOf?.[0]?.$ref;

      it.each([
        ['PartialType', (base: Type<any>) => PartialType(base), ''],
        [
          'DeepPartialType',
          (base: Type<any>) => DeepPartialType(base),
          'DeepPartial'
        ],
        [
          'PickType',
          (base: Type<any>) => PickType(base, ['profile', 'contact']),
          ''
        ],
        ['OmitType', (base: Type<any>) => OmitType(base, []), ''],
        ['IntersectionType', (base: Type<any>) => IntersectionType(base), '']
      ])(
        'should document the type of the re-declaration in %s',
        (_, map, prefix) => {
          const { PublicProfileDto, UserDto } = createDtos();
          // "profile" reaches the parent as decorator metadata of a mapped type,
          // "contact" as the decorator metadata of "UserDto"
          class PublicUserDto extends OmitType(UserDto, ['id'] as never[]) {
            static _OPENAPI_METADATA_FACTORY() {
              return publicUserMetadata(PublicProfileDto);
            }
          }
          class MappedDto extends (map(PublicUserDto) as Type<any>) {}

          const schemas: Record<string, any> = {};
          schemaObjectFactory.exploreModelSchema(MappedDto, schemas);
          schemaObjectFactory.exploreModelSchema(PublicUserDto, schemas);

          const { properties } = schemas.MappedDto;
          const publicProfileRef = `#/components/schemas/${prefix}PublicProfileDto`;
          expect(refOf(properties.profile)).toEqual(publicProfileRef);
          expect(refOf(properties.contact)).toEqual(publicProfileRef);
          expect(properties.contact.description).toEqual('Contact details');
          expect(schemas).not.toHaveProperty(`${prefix}ProfileDto`);
        }
      );

      it('should keep a decorator on the parent over its CLI plugin metadata', () => {
        const { PublicProfileDto, UserDto } = createDtos();
        class ContactDto {
          static _OPENAPI_METADATA_FACTORY() {
            return { email: { required: true, type: () => String } };
          }
        }
        class PublicUserDto extends OmitType(UserDto, ['id'] as never[]) {
          @ApiProperty({ type: () => ContactDto })
          contact: ContactDto;

          static _OPENAPI_METADATA_FACTORY() {
            return publicUserMetadata(PublicProfileDto);
          }
        }
        class UpdatePublicUserDto extends PartialType(PublicUserDto) {}

        const schemas: Record<string, any> = {};
        schemaObjectFactory.exploreModelSchema(UpdatePublicUserDto, schemas);

        const { properties } = schemas.UpdatePublicUserDto;
        expect(refOf(properties.profile)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(refOf(properties.contact)).toEqual(
          '#/components/schemas/ContactDto'
        );
      });

      it('should document the type of a re-declaration by an ancestor of the parent', () => {
        const { PublicProfileDto, UserDto } = createDtos();
        class PublicUserDto extends OmitType(UserDto, ['id'] as never[]) {
          static _OPENAPI_METADATA_FACTORY() {
            return publicUserMetadata(PublicProfileDto);
          }
        }
        class PublicAdminDto extends PublicUserDto {
          static _OPENAPI_METADATA_FACTORY() {
            return { role: { required: true, type: () => String } };
          }
        }
        class UpdatePublicAdminDto extends PartialType(PublicAdminDto) {}

        const schemas: Record<string, any> = {};
        schemaObjectFactory.exploreModelSchema(PublicUserDto, schemas);
        schemaObjectFactory.exploreModelSchema(PublicAdminDto, schemas);
        schemaObjectFactory.exploreModelSchema(UpdatePublicAdminDto, schemas);

        // The mapped type must not change how its parent is documented either
        for (const name of ['PublicAdminDto', 'UpdatePublicAdminDto']) {
          const { properties } = schemas[name];
          expect(Object.keys(properties).sort()).toEqual([
            'contact',
            'profile',
            'role'
          ]);
          expect(refOf(properties.profile)).toEqual(
            '#/components/schemas/PublicProfileDto'
          );
          expect(refOf(properties.contact)).toEqual(
            '#/components/schemas/PublicProfileDto'
          );
        }
        expect(schemas).not.toHaveProperty('ProfileDto');
      });

      it('should document the type of the re-declaration when the parent metadata is loaded later', async () => {
        const { PublicProfileDto, UserDto } = createDtos();
        class PublicUserDto extends UserDto {}
        class UpdatePublicUserDto extends PartialType(PublicUserDto) {}

        await metadataLoader.load({
          '@nestjs/swagger': {
            models: [
              [
                Promise.resolve({ PublicUserDto }),
                { PublicUserDto: publicUserMetadata(PublicProfileDto) }
              ]
            ]
          }
        });

        const schemas: Record<string, any> = {};
        schemaObjectFactory.exploreModelSchema(UpdatePublicUserDto, schemas);
        schemaObjectFactory.exploreModelSchema(PublicUserDto, schemas);

        for (const name of ['UpdatePublicUserDto', 'PublicUserDto']) {
          const { properties } = schemas[name];
          expect(refOf(properties.profile)).toEqual(
            '#/components/schemas/PublicProfileDto'
          );
          expect(refOf(properties.contact)).toEqual(
            '#/components/schemas/PublicProfileDto'
          );
        }
        expect(schemas).not.toHaveProperty('ProfileDto');
      });
    });
  });
});

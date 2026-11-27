import { Type } from '@nestjs/common';
import {
  Expose,
  Transform,
  Type as TransformType,
  instanceToInstance,
  plainToInstance
} from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '../../lib/decorators';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { IntersectionType, OmitType } from '../../lib/type-helpers';

describe('IntersectionType', () => {
  class CreateUserDto {
    @ApiProperty({ required: true })
    login: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @IsString()
    @ApiProperty({ minLength: 10 })
    password: string;

    static [METADATA_FACTORY_NAME]() {
      return { dateOfBirth: { required: true, type: () => String } };
    }
  }

  class UserDto {
    @IsString()
    @ApiProperty({ required: false })
    firstName: string;

    static [METADATA_FACTORY_NAME]() {
      return { dateOfBirth2: { required: true, type: () => String } };
    }
  }

  class AuthorityDto {
    @IsBoolean()
    @ApiProperty({ required: true })
    isAdmin: boolean;

    static [METADATA_FACTORY_NAME]() {
      return { dateOfBirth3: { required: true, type: () => String } };
    }
  }

  class UpdateUserDto extends IntersectionType(
    UserDto,
    CreateUserDto,
    AuthorityDto
  ) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should return combined class', () => {
      const prototype = UpdateUserDto.prototype as any as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'firstName',
        'login',
        'password',
        'isAdmin',
        'dateOfBirth2',
        'dateOfBirth',
        'dateOfBirth3'
      ]);
    });
  });

  describe('property declared by a later class with CLI plugin metadata only', () => {
    const schemaObjectFactory = new SchemaObjectFactory(
      new ModelPropertiesAccessor(),
      new SwaggerTypesMapper()
    );
    const refOf = (property: Record<string, any>) =>
      property.$ref ?? property.allOf?.[0]?.$ref;

    const createDtos = () => {
      class ProfileDto {
        static [METADATA_FACTORY_NAME]() {
          return {
            displayName: { required: true, type: () => String },
            salary: { required: false, type: () => Number }
          };
        }
      }
      class PublicProfileDto {
        static [METADATA_FACTORY_NAME]() {
          return { displayName: { required: true, type: () => String } };
        }
      }
      class CompactProfileDto {
        static [METADATA_FACTORY_NAME]() {
          return { initials: { required: true, type: () => String } };
        }
      }
      class UserDto {
        @ApiProperty({ description: 'User profile' })
        profile: ProfileDto;

        @ApiProperty({ type: [ProfileDto], description: 'Linked profiles' })
        linkedProfiles: ProfileDto[];

        static [METADATA_FACTORY_NAME]() {
          return {
            id: { required: true, type: () => String },
            profile: { required: true, type: () => ProfileDto },
            linkedProfiles: { required: true, type: () => [ProfileDto] }
          };
        }
      }
      class PublicProfileViewDto {
        static [METADATA_FACTORY_NAME]() {
          return {
            profile: { required: true, type: () => PublicProfileDto },
            linkedProfiles: { required: true, type: () => PublicProfileDto }
          };
        }
      }
      class CompactProfileViewDto {
        static [METADATA_FACTORY_NAME]() {
          return { profile: { required: true, type: () => CompactProfileDto } };
        }
      }
      class AuditDto {
        static [METADATA_FACTORY_NAME]() {
          return { createdAt: { required: true, type: () => Date } };
        }
      }
      return { UserDto, PublicProfileViewDto, CompactProfileViewDto, AuditDto };
    };

    const explore = (...types: Type<unknown>[]) => {
      const schemas: Record<string, any> = {};
      types.forEach((type) =>
        schemaObjectFactory.exploreModelSchema(type, schemas)
      );
      return schemas;
    };

    describe.each([
      ['unexplored', false],
      ['explored before the intersection is built', true]
    ])('with the later classes %s', (_, exploreLaterClassesFirst) => {
      it.each([
        ['a decorated class', (dto: Type<any>) => dto],
        ['a mapped type', (dto: Type<any>) => OmitType(dto, ['id'] as never[])]
      ])('should document the type of the later class over %s', (_, first) => {
        const { UserDto, PublicProfileViewDto } = createDtos();
        if (exploreLaterClassesFirst) {
          explore(PublicProfileViewDto);
        }
        class PublicUserDto extends IntersectionType(
          first(UserDto) as Type<any>,
          PublicProfileViewDto
        ) {}

        const schemas = explore(PublicUserDto);
        const { properties, required } = schemas.PublicUserDto;
        expect(refOf(properties.profile)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(properties.profile.description).toEqual('User profile');
        expect(required).toContain('profile');
        expect(schemas).not.toHaveProperty('ProfileDto');
      });

      it('should not keep the array type of the earlier class', () => {
        const { UserDto, PublicProfileViewDto } = createDtos();
        if (exploreLaterClassesFirst) {
          explore(PublicProfileViewDto);
        }
        class PublicUserDto extends IntersectionType(
          UserDto,
          PublicProfileViewDto
        ) {}

        const { linkedProfiles } =
          explore(PublicUserDto).PublicUserDto.properties;
        expect(linkedProfiles.type).toBeUndefined();
        expect(linkedProfiles.items).toBeUndefined();
        expect(refOf(linkedProfiles)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(linkedProfiles.description).toEqual('Linked profiles');
      });

      it('should document the type of the last class that declares the property', () => {
        const {
          UserDto,
          PublicProfileViewDto,
          CompactProfileViewDto,
          AuditDto
        } = createDtos();
        if (exploreLaterClassesFirst) {
          explore(PublicProfileViewDto, CompactProfileViewDto, AuditDto);
        }
        class CompactUserDto extends IntersectionType(
          UserDto,
          PublicProfileViewDto,
          CompactProfileViewDto
        ) {}
        class PublicUserDto extends IntersectionType(
          UserDto,
          PublicProfileViewDto,
          AuditDto
        ) {}

        const schemas = explore(CompactUserDto, PublicUserDto);
        const compactProfile = schemas.CompactUserDto.properties.profile;
        expect(refOf(compactProfile)).toEqual(
          '#/components/schemas/CompactProfileDto'
        );
        expect(compactProfile.description).toEqual('User profile');

        const { properties } = schemas.PublicUserDto;
        expect(Object.keys(properties).sort()).toEqual([
          'createdAt',
          'id',
          'linkedProfiles',
          'profile'
        ]);
        expect(refOf(properties.profile)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(properties.profile.description).toEqual('User profile');
        expect(schemas).not.toHaveProperty('ProfileDto');
      });
    });

    it('should keep the options of the earlier class when only some later classes were explored', () => {
      const { UserDto, PublicProfileViewDto, CompactProfileViewDto } =
        createDtos();
      explore(PublicProfileViewDto);
      class CompactUserDto extends IntersectionType(
        UserDto,
        PublicProfileViewDto,
        CompactProfileViewDto
      ) {}

      const { profile } = explore(CompactUserDto).CompactUserDto.properties;
      expect(refOf(profile)).toEqual('#/components/schemas/CompactProfileDto');
      expect(profile.description).toEqual('User profile');
    });

    it('should keep a later class that decorates the property over the earlier one', () => {
      const { UserDto } = createDtos();
      class CompactProfileDto {
        static [METADATA_FACTORY_NAME]() {
          return { initials: { required: true, type: () => String } };
        }
      }
      class CompactProfileViewDto {
        @ApiProperty({ type: () => CompactProfileDto })
        profile: CompactProfileDto;
      }
      class CompactUserDto extends IntersectionType(
        UserDto,
        CompactProfileViewDto
      ) {}

      const { properties } = explore(CompactUserDto).CompactUserDto;
      expect(refOf(properties.profile)).toEqual(
        '#/components/schemas/CompactProfileDto'
      );
      expect(properties.profile.description).toEqual('User profile');
    });

    it.each([
      ['unexplored', false],
      ['explored first', true]
    ])(
      'should take whether the property is required from the later class (%s) unless the earlier class decorates it',
      (_, exploreLaterClassFirst) => {
        class ProfileDto {}
        class PublicProfileDto {}
        class UserDto {
          @ApiProperty({ description: 'User profile' })
          profile: ProfileDto;

          @ApiPropertyOptional({ description: 'User avatar' })
          avatar?: ProfileDto;
        }
        class PublicProfileViewDto {
          static [METADATA_FACTORY_NAME]() {
            return {
              profile: { required: false, type: () => PublicProfileDto },
              avatar: { required: true, type: () => PublicProfileDto }
            };
          }
        }
        if (exploreLaterClassFirst) {
          explore(PublicProfileViewDto);
        }
        class PublicUserDto extends IntersectionType(
          UserDto,
          PublicProfileViewDto
        ) {}

        const { properties, required } = explore(PublicUserDto).PublicUserDto;
        expect(refOf(properties.profile)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(refOf(properties.avatar)).toEqual(
          '#/components/schemas/PublicProfileDto'
        );
        expect(required ?? []).not.toContain('profile');
        expect(required ?? []).not.toContain('avatar');
      }
    );

    it('should document the type of the later class over a mapped type of a class without decorators', () => {
      class ProfileDto {}
      class PublicProfileDto {}
      class UserDto {
        static [METADATA_FACTORY_NAME]() {
          return {
            id: { required: true, type: () => String },
            profile: { required: true, type: () => ProfileDto }
          };
        }
      }
      class PublicProfileViewDto {
        static [METADATA_FACTORY_NAME]() {
          return { profile: { required: true, type: () => PublicProfileDto } };
        }
      }
      class PublicUserDto extends IntersectionType(
        OmitType(UserDto, ['id'] as never[]),
        PublicProfileViewDto
      ) {}

      const schemas = explore(PublicUserDto);
      const { properties } = schemas.PublicUserDto;
      expect(Object.keys(properties)).toEqual(['profile']);
      expect(refOf(properties.profile)).toEqual(
        '#/components/schemas/PublicProfileDto'
      );
      expect(schemas).not.toHaveProperty('ProfileDto');
    });

    it('should document the type of the later class when its metadata is loaded later', async () => {
      const { UserDto } = createDtos();
      class PublicProfileDto {}
      class PublicProfileViewDto {}
      class PublicUserDto extends IntersectionType(
        UserDto,
        PublicProfileViewDto
      ) {}

      await new MetadataLoader().load({
        '@nestjs/swagger': {
          models: [
            [
              Promise.resolve({ PublicProfileViewDto }),
              {
                PublicProfileViewDto: {
                  profile: { required: true, type: () => PublicProfileDto }
                }
              }
            ]
          ]
        }
      });

      const { properties } = explore(PublicUserDto).PublicUserDto;
      expect(refOf(properties.profile)).toEqual(
        '#/components/schemas/PublicProfileDto'
      );
      expect(properties.profile.description).toEqual('User profile');
    });
  });

  describe('Transformation metadata', () => {
    class ClassA {
      @Transform(({ value }) => value + '_transformed')
      repeatedProperty = 'value';
    }

    class ClassB {
      @Transform(({ value }) => value + '_transformed')
      repeatedProperty = 'value';
    }

    class IntersectionDto extends IntersectionType(ClassA, ClassB) {}

    it('should not stack transformers declared on the same property', () => {
      const result = instanceToInstance(new IntersectionDto());
      expect(result.repeatedProperty).toEqual('value_transformed');
    });

    class OtherClass {
      other = 'other';
    }

    it('should keep the transformers of a derived class and its base', () => {
      class BaseClass {
        @Transform(({ value }) => value + '_base')
        property = 'value';
      }
      class DerivedClass extends BaseClass {
        @Transform(({ value }) => value + '_derived')
        declare property: string;
      }
      class Dto extends IntersectionType(DerivedClass, OtherClass) {}

      expect(instanceToInstance(new Dto()).property).toEqual(
        instanceToInstance(new DerivedClass()).property
      );
    });

    it('should keep the @Type() override of a derived class', () => {
      class FirstNested {}
      class SecondNested {}
      class BaseClass {
        @TransformType(() => FirstNested)
        nested: object;
      }
      class DerivedClass extends BaseClass {
        @TransformType(() => SecondNested)
        declare nested: object;
      }
      class Dto extends IntersectionType(DerivedClass, OtherClass) {}

      expect(plainToInstance(Dto, { nested: {} }).nested).toBeInstanceOf(
        SecondNested
      );
    });
  });
});

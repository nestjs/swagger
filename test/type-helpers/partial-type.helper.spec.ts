import { Type } from '@nestjs/common';
import { validate } from 'class-validator';
import { DECORATORS } from '../../lib/constants';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ApiProperty } from '../../lib/decorators';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import {
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
  });
});

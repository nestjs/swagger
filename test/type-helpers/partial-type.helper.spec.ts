import { Type } from '@nestjs/common';
import { validate } from 'class-validator';
import { DECORATORS } from '../../lib/constants';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PartialType } from '../../lib/type-helpers';
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
});

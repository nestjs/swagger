import { Type } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import {IsString, validate, ValidateIf} from 'class-validator';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PartialType } from '../../lib/type-helpers';

describe('PartialType', () => {
  class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @ApiProperty({ required: true })
    login: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @IsString()
    @ApiProperty({ minLength: 10 })
    password: string;

    static [METADATA_FACTORY_NAME]() {
      return {
        firstName: { required: true, type: String },
        lastName: { required: true, type: String }
      };
    }
  }

  class UpdateUserDto extends PartialType(CreateUserDto) {}
  class UpdateUserNotNullableDto extends PartialType(CreateUserDto, ValidateIf((obj, value) => typeof value !== 'undefined')) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('Validation metadata', () => {
    it('should apply @IsOptional to properties reflected by the plugin', async () => {
      const updateDto = new UpdateUserDto();
      const validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(0);
    });

    it('should apply custom decorators to properties reflected by the plugin', async () => {
      let updateDto = new UpdateUserNotNullableDto();
      let validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(0);

      updateDto = new UpdateUserNotNullableDto();
      updateDto.firstName = null;
      validationErrors = await validate(updateDto);
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors).toMatchObject([
        {
          constraints: {
            "isString": "firstName must be a string",
          },
        },
      ]);
    });
  });
  describe('OpenAPI metadata', () => {
    it('should return partial class', () => {
      const prototype = (UpdateUserDto.prototype as any) as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'login',
        'password',
        'firstName',
        'lastName'
      ]);
    });

    it('should set "required" option to "false" for each property', () => {
      const classRef = (UpdateUserDto.prototype as any) as Type<any>;
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

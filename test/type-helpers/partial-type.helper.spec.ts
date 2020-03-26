import { Type } from '@nestjs/common';
import { classToClass, Expose, Transform } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PartialType } from '../../lib/type-helpers';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('PartialType', () => {
  class CreateUserDto {
    @ApiProperty({ required: true })
    login: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @IsString()
    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UpdateUserDto extends PartialType(CreateUserDto) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should return partial class', () => {
      expect(
        modelPropertiesAccessor.getModelProperties(
          (UpdateUserDto.prototype as any) as Type<any>
        )
      ).toEqual(['login', 'password']);
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
    });
  });
  describe('Validation metadata', () => {
    it('should inherit metadata and apply @IsOptional() to each property', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName
      );
      expect(validationKeys).toEqual(['password', 'login', 'password']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = 1234567 as any;

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          isString: 'password must be a string'
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567891011';

        const validationErrors = await validate(updateDto);
        expect(validationErrors.length).toEqual(0);
      });
    });
  });

  describe('Transformer metadata', () => {
    it('should inherit transformer metadata', () => {
      const password = '1234567891011';
      const updateDto = new UpdateUserDto();
      updateDto.password = password;

      const transformedDto = classToClass(updateDto);
      expect(transformedDto.password).toEqual(password + '_transformed');
    });
  });
});

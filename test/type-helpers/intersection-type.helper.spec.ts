import { Type } from '@nestjs/common';
import { classToClass, Expose, Transform } from 'class-transformer';
import { IsString, validate } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { IntersectionType } from '../../lib/type-helpers';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('IntersectionType', () => {
  class CreateUserDto {
    @ApiProperty({ required: true })
    login: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @IsString()
    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UserDto {
    @IsString()
    @ApiProperty({ required: false })
    firstName: string;
  }

  class UpdateUserDto extends IntersectionType(UserDto, CreateUserDto) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should return combined class', () => {
      expect(
        modelPropertiesAccessor.getModelProperties(
          (UpdateUserDto.prototype as any) as Type<any>
        )
      ).toEqual(['firstName', 'login', 'password']);
    });
  });
  describe('Validation metadata', () => {
    it('should inherit metadata with all properties', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName
      );
      expect(validationKeys).toEqual(['firstName', 'password']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = 1234567 as any;
        updateDto.firstName = 'test';

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
        updateDto.password = '1234567891011';
        updateDto.firstName = '1234567891011';

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
      updateDto.firstName = 'test';

      const transformedDto = classToClass(updateDto);
      expect(transformedDto.password).toEqual(password + '_transformed');
    });
  });
});

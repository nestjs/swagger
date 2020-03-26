import { Type } from '@nestjs/common';
import { classToClass, Transform } from 'class-transformer';
import { MinLength, validate } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { OmitType } from '../../lib/type-helpers';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('OmitType', () => {
  class CreateUserDto {
    @MinLength(10)
    @ApiProperty({ required: true })
    login: string;

    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UpdateUserDto extends OmitType(CreateUserDto, ['login']) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should omit "login" property', () => {
      expect(
        modelPropertiesAccessor.getModelProperties(
          (UpdateUserDto.prototype as any) as Type<any>
        )
      ).toEqual(['password']);
    });
  });

  describe('Validation metadata', () => {
    it('should inherit metadata with "login" property excluded', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName
      );
      expect(validationKeys).toEqual(['password']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567';

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'password must be longer than or equal to 10 characters'
        });
      });
    });
    describe('otherwise', () => {
      it('"validate" should return an empty array', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.password = '1234567891011';

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

import { Type } from '@nestjs/common';
import { classToClass, Transform } from 'class-transformer';
import { MinLength, validate } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PickType } from '../../lib/type-helpers';
import { getValidationMetadataByTarget } from './type-helpers.test-utils';

describe('PickType', () => {
  class CreateUserDto {
    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @ApiProperty({ required: true })
    login: string;

    @MinLength(10)
    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UpdateUserDto extends PickType(CreateUserDto, ['login']) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should pick "login" property', () => {
      expect(
        modelPropertiesAccessor.getModelProperties(
          (UpdateUserDto.prototype as any) as Type<any>
        )
      ).toEqual(['login']);
    });
  });
  describe('Validation metadata', () => {
    it('should inherit metadata with "password" property excluded', () => {
      const validationKeys = getValidationMetadataByTarget(UpdateUserDto).map(
        (item) => item.propertyName
      );
      expect(validationKeys).toEqual(['login']);
    });
    describe('when object does not fulfil validation rules', () => {
      it('"validate" should return validation errors', async () => {
        const updateDto = new UpdateUserDto();
        updateDto.login = '1234567';

        const validationErrors = await validate(updateDto);

        expect(validationErrors.length).toEqual(1);
        expect(validationErrors[0].constraints).toEqual({
          minLength: 'login must be longer than or equal to 10 characters'
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
      const login = '1234567891011';
      const updateDto = new UpdateUserDto();
      updateDto.login = login;

      const transformedDto = classToClass(updateDto);
      expect(transformedDto.login).toEqual(login + '_transformed');
    });
  });
});

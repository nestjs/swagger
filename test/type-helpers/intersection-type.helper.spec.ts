import { Type } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsString,
  MinLength,
  validateSync
} from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { IntersectionType } from '../../lib/type-helpers';

describe('IntersectionType', () => {
  class CreateUserDto {
    @IsEmail()
    @ApiProperty({ required: true })
    email: string;

    @Expose()
    @Transform((str) => str + '_transformed')
    @MinLength(8)
    @IsString()
    @ApiProperty({ minLength: 8 })
    password: string;

    static [METADATA_FACTORY_NAME]() {
      return { dateOfBirth: { required: true, type: () => String } };
    }
  }

  class UserDto {
    @IsString()
    @ApiProperty({ required: false })
    firstName: string;
  }

  class MetaDto {
    @IsDateString()
    @ApiProperty({ required: false })
    createdAt: string;

    static [METADATA_FACTORY_NAME]() {
      return { userId: { required: true, type: () => String } };
    }
  }

  class UpdateUserDto extends IntersectionType(
    MetaDto,
    UserDto,
    CreateUserDto
  ) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI Metadata', () => {
    it('should return combined class', () => {
      const prototype = UpdateUserDto.prototype as any as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);

      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'createdAt',
        'firstName',
        'email',
        'password',
        'userId',
        'dateOfBirth'
      ]);
    });
  });

  describe('Class Validation', () => {
    it('should validate property values', () => {
      const dto = new UpdateUserDto();

      expect(validateSync(dto)).toHaveLength(4);

      dto.firstName = 'John';
      dto.email = 'john.doe@test.com';
      dto.createdAt = '2022-05-25T10:46:00';

      expect(validateSync(dto)).toHaveLength(1);

      dto.password = 'Test123!';

      expect(validateSync(dto)).toHaveLength(0);

      dto.email = 'john.doe@test.x';
      dto.password = '2short!';

      const errors = validateSync(dto);

      expect(errors).toHaveLength(2);
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(errors[1].constraints).toHaveProperty('minLength');
    });
  });
});

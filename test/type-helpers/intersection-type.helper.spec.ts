import { Type } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { IntersectionType } from '../../lib/type-helpers';

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

  class UpdateUserDto extends IntersectionType(UserDto, CreateUserDto) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should return combined class', () => {
      const prototype = (UpdateUserDto.prototype as any) as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'firstName',
        'login',
        'password',
        'dateOfBirth2',
        'dateOfBirth'
      ]);
    });
  });
});

import { Type } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { OmitType } from '../../lib/type-helpers';

describe('OmitType', () => {
  class CreateUserDto {
    @MinLength(10)
    @ApiProperty({ required: true })
    login: string;

    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @ApiProperty({ minLength: 10 })
    password: string;

    lastName: string;

    static [METADATA_FACTORY_NAME]() {
      return {
        firstName: { required: true, type: () => String },
        lastName: { required: true, type: () => String }
      };
    }
  }

  class UpdateUserDto extends OmitType(CreateUserDto, ['login', 'lastName']) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should omit "login" property', () => {
      const prototype = (UpdateUserDto.prototype as any) as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'password',
        'firstName'
      ]);
    });
  });
});

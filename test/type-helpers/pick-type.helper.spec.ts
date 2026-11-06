import { Type } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PickType } from '../../lib/type-helpers';

describe('PickType', () => {
  class CreateUserDto {
    @Transform((str) => str + '_transformed')
    @MinLength(10)
    @ApiProperty({ required: true })
    login: string;

    @MinLength(10)
    @ApiProperty({ minLength: 10 })
    password: string;

    firstName: string;

    static [METADATA_FACTORY_NAME]() {
      return {
        firstName: { required: true, type: () => String },
        lastName: { required: true, type: () => String }
      };
    }
  }

  class UpdateUserDto extends PickType(CreateUserDto, ['login', 'firstName']) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should pick "login" property', () => {
      const prototype = (UpdateUserDto.prototype as any) as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'login',
        'firstName'
      ]);
    });

    it('should pick a property whose key is a number', () => {
      class PricesDto {
        @ApiProperty()
        0: number;

        @ApiProperty()
        1: number;
      }

      class PublicPricesDto extends PickType(PricesDto, [0]) {}

      const prototype = PublicPricesDto.prototype as any as Type<unknown>;

      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        '0'
      ]);
    });
  });
});

import { Type } from '@nestjs/common';
import { getMetadataStorage, IsNumber } from 'class-validator';
import { ApiProperty } from '../../lib/decorators';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { OmitType } from '../../lib/type-helpers';
import { CreateUserDto } from './fixtures/create-user-dto.fixture';
import { SERIALIZED_METADATA } from './fixtures/serialized-metadata.fixture';

class UpdateUserDto extends OmitType(CreateUserDto, ['login', 'lastName']) {}

describe('OmitType', () => {
  const metadataLoader = new MetadataLoader();

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should omit "login" property', async () => {
      await metadataLoader.load(SERIALIZED_METADATA);

      const prototype = UpdateUserDto.prototype as any as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'password',
        'firstName',
        'active',
        'role'
      ]);
    });
  });

  describe('when a key is a number', () => {
    class PricesDto {
      @IsNumber()
      @ApiProperty()
      0: number;

      @IsNumber()
      @ApiProperty()
      1: number;
    }

    class PublicPricesDto extends OmitType(PricesDto, [1]) {}

    it('should omit the property', () => {
      const prototype = PublicPricesDto.prototype as any as Type<unknown>;

      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        '0'
      ]);
    });

    it('should not inherit its validation metadata', () => {
      const validationMetadata =
        getMetadataStorage().getTargetValidationMetadatas(
          PublicPricesDto,
          null,
          false,
          false
        );

      expect(validationMetadata.map((item) => item.propertyName)).toEqual([
        '0'
      ]);
    });
  });
});

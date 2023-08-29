import { Type } from '@nestjs/common';
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
});

import { Type } from '@nestjs/common';
import { ApiHideProperty, ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { OmitType } from '../../lib/type-helpers';

describe('ModelPropertiesAccessor', () => {
  class CreateUserDto {
    @ApiProperty()
    login: string;

    @ApiProperty()
    password: string;
  }

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('getModelProperties', () => {
    it('should return all decorated properties', () => {
      expect(
        modelPropertiesAccessor.getModelProperties(
          CreateUserDto.prototype as any as Type<any>
        )
      ).toEqual(['login', 'password']);
    });

    it('should omit an inherited property hidden by the subclass', () => {
      class UserDto extends CreateUserDto {
        @ApiHideProperty()
        password: string;
      }
      expect(
        modelPropertiesAccessor.getModelProperties(
          UserDto.prototype as any as Type<any>
        )
      ).toEqual(['login']);
    });

    it('should include a hidden property that the subclass publishes again', () => {
      class UserEntity {
        @ApiHideProperty()
        password: string;
      }
      class UserDto extends UserEntity {
        @ApiProperty()
        password: string;
      }
      expect(
        modelPropertiesAccessor.getModelProperties(
          UserDto.prototype as any as Type<any>
        )
      ).toEqual(['password']);
    });
  });

  describe('applyMetadataFactory', () => {
    class UserEntity {
      id: number;
      passwordHash: string;

      static [METADATA_FACTORY_NAME]() {
        return {
          id: { required: true, type: () => Number },
          passwordHash: { required: true, type: () => String }
        };
      }
    }

    class UserDto extends UserEntity {
      @ApiHideProperty()
      passwordHash: string;

      static [METADATA_FACTORY_NAME]() {
        return {};
      }
    }

    it('should not apply a parent factory entry hidden by the subclass', () => {
      const prototype = UserDto.prototype as any as Type<any>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'id'
      ]);
    });

    it('should still apply the factory entry to the parent class', () => {
      const prototype = UserEntity.prototype as any as Type<any>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'id',
        'passwordHash'
      ]);
    });

    it('should not clone a parent factory entry hidden by the subclass into a mapped type', () => {
      const prototype = OmitType(UserDto, []).prototype as any as Type<any>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'id'
      ]);
    });
  });
});

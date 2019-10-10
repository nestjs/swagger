import { Type } from '@nestjs/common';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';

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
          (CreateUserDto.prototype as any) as Type<any>
        )
      ).toEqual(['login', 'password']);
    });
  });
});

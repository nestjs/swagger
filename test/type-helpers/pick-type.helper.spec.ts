import { Type } from '@nestjs/common';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PickType } from '../../lib/type-helpers';

describe('PickType', () => {
  class CreateUserDto {
    @ApiProperty({ required: true })
    login: string;

    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UpdateUserDto extends PickType(CreateUserDto, ['login']) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  it('should pick "login" property', () => {
    expect(
      modelPropertiesAccessor.getModelProperties(
        (UpdateUserDto.prototype as any) as Type<any>
      )
    ).toEqual(['login']);
  });
});

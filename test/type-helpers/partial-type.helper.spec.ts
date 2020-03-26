import { Type } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { PartialType } from '../../lib/type-helpers';

describe('PartialType', () => {
  class CreateUserDto {
    @ApiProperty({ required: true })
    login: string;

    @ApiProperty({ minLength: 10 })
    password: string;
  }

  class UpdateUserDto extends PartialType(CreateUserDto) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  it('should return partial class', () => {
    expect(
      modelPropertiesAccessor.getModelProperties(
        (UpdateUserDto.prototype as any) as Type<any>
      )
    ).toEqual(['login', 'password']);
  });

  it('should set "required" option to "false" for each property', () => {
    const classRef = (UpdateUserDto.prototype as any) as Type<any>;
    const keys = modelPropertiesAccessor.getModelProperties(classRef);
    const metadata = keys.map(key => {
      return Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        classRef,
        key
      );
    });
    expect(metadata[0]).toEqual({
      isArray: false,
      required: false,
      type: String
    });
    expect(metadata[1]).toEqual({
      isArray: false,
      required: false,
      minLength: 10,
      type: String
    });
  });
});

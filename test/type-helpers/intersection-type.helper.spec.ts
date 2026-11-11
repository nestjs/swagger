import { Type } from '@nestjs/common';
import {
  Expose,
  Transform,
  Type as TransformType,
  instanceToInstance,
  plainToInstance
} from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';
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

  class AuthorityDto {
    @IsBoolean()
    @ApiProperty({ required: true })
    isAdmin: boolean;

    static [METADATA_FACTORY_NAME]() {
      return { dateOfBirth3: { required: true, type: () => String } };
    }
  }

  class UpdateUserDto extends IntersectionType(
    UserDto,
    CreateUserDto,
    AuthorityDto
  ) {}

  let modelPropertiesAccessor: ModelPropertiesAccessor;

  beforeEach(() => {
    modelPropertiesAccessor = new ModelPropertiesAccessor();
  });

  describe('OpenAPI metadata', () => {
    it('should return combined class', () => {
      const prototype = UpdateUserDto.prototype as any as Type<unknown>;

      modelPropertiesAccessor.applyMetadataFactory(prototype);
      expect(modelPropertiesAccessor.getModelProperties(prototype)).toEqual([
        'firstName',
        'login',
        'password',
        'isAdmin',
        'dateOfBirth2',
        'dateOfBirth',
        'dateOfBirth3'
      ]);
    });
  });

  describe('Transformation metadata', () => {
    class ClassA {
      @Transform(({ value }) => value + '_transformed')
      repeatedProperty = 'value';
    }

    class ClassB {
      @Transform(({ value }) => value + '_transformed')
      repeatedProperty = 'value';
    }

    class IntersectionDto extends IntersectionType(ClassA, ClassB) {}

    it('should not stack transformers declared on the same property', () => {
      const result = instanceToInstance(new IntersectionDto());
      expect(result.repeatedProperty).toEqual('value_transformed');
    });

    class OtherClass {
      other = 'other';
    }

    it('should keep the transformers of a derived class and its base', () => {
      class BaseClass {
        @Transform(({ value }) => value + '_base')
        property = 'value';
      }
      class DerivedClass extends BaseClass {
        @Transform(({ value }) => value + '_derived')
        declare property: string;
      }
      class Dto extends IntersectionType(DerivedClass, OtherClass) {}

      expect(instanceToInstance(new Dto()).property).toEqual(
        instanceToInstance(new DerivedClass()).property
      );
    });

    it('should keep the @Type() override of a derived class', () => {
      class FirstNested {}
      class SecondNested {}
      class BaseClass {
        @TransformType(() => FirstNested)
        nested: object;
      }
      class DerivedClass extends BaseClass {
        @TransformType(() => SecondNested)
        declare nested: object;
      }
      class Dto extends IntersectionType(DerivedClass, OtherClass) {}

      expect(plainToInstance(Dto, { nested: {} }).nested).toBeInstanceOf(
        SecondNested
      );
    });
  });
});

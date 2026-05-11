import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { DeepPartialType } from '../../lib/type-helpers';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

function getMetadata(classRef: any, key: string) {
  return Reflect.getMetadata(
    DECORATORS.API_MODEL_PROPERTIES,
    classRef.prototype,
    key
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

class AddressDto {
  @ApiProperty({ type: String })
  street: string;

  @ApiProperty({ type: String, required: true })
  city: string;
}

class ProfileDto {
  @ApiProperty({ type: String })
  bio: string;

  @ApiProperty({ type: () => AddressDto })
  address: AddressDto;
}

class UserDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  age: number;

  @ApiProperty({ type: () => ProfileDto })
  profile: ProfileDto;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeepPartialType', () => {
  describe('top-level properties', () => {
    class UpdateUserDto extends DeepPartialType(UserDto) {}

    it('should mark all top-level properties as optional', () => {
      const fields =
        modelPropertiesAccessor.getModelProperties(UpdateUserDto.prototype);
      expect(fields).toContain('name');
      expect(fields).toContain('age');
      expect(fields).toContain('profile');

      expect(getMetadata(UpdateUserDto, 'name').required).toBe(false);
      expect(getMetadata(UpdateUserDto, 'age').required).toBe(false);
      expect(getMetadata(UpdateUserDto, 'profile').required).toBe(false);
    });
  });

  describe('nested DTO properties', () => {
    class UpdateUserDto extends DeepPartialType(UserDto) {}

    function resolveType(meta: any): any {
      const t = meta?.type;
      if (typeof t !== 'function') return t;
      // If it's a lazy factory (zero-arg, not a constructor name), call it
      try {
        // constructors have their name set; anonymous arrow functions don't
        if (!t.prototype || !t.prototype.constructor?.name) {
          return t();
        }
      } catch {
        // fallthrough
      }
      return t;
    }

    it('should wrap nested DTO properties in DeepPartialType', () => {
      const profileMeta = getMetadata(UpdateUserDto, 'profile');
      const NestedProfileType = resolveType(profileMeta);

      // The nested type is a class — not the original ProfileDto
      expect(NestedProfileType).not.toBe(ProfileDto);

      // Its own properties should be optional
      const nestedFields = modelPropertiesAccessor.getModelProperties(
        NestedProfileType.prototype
      );
      expect(nestedFields).toContain('bio');
      expect(nestedFields).toContain('address');
      expect(
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          NestedProfileType.prototype,
          'bio'
        ).required
      ).toBe(false);
    });

    it('should recursively wrap deeply nested DTO properties', () => {
      const profileMeta = getMetadata(UpdateUserDto, 'profile');
      const NestedProfileType = resolveType(profileMeta);

      const addressMeta = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        NestedProfileType.prototype,
        'address'
      );
      const NestedAddressType = resolveType(addressMeta);

      expect(NestedAddressType).not.toBe(AddressDto);

      const streetMeta = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        NestedAddressType.prototype,
        'street'
      );
      expect(streetMeta.required).toBe(false);
    });
  });

  describe('primitive properties', () => {
    it('should leave primitive types unchanged (String, Number, Boolean)', () => {
      class UpdateUserDto extends DeepPartialType(UserDto) {}
      expect(getMetadata(UpdateUserDto, 'name').type).toBe(String);
      expect(getMetadata(UpdateUserDto, 'age').type).toBe(Number);
    });
  });

  describe('class caching', () => {
    it('should return the same class for the same input to avoid infinite recursion', () => {
      const A = DeepPartialType(UserDto);
      const B = DeepPartialType(UserDto);
      expect(A).toBe(B);
    });
  });
});

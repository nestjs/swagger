import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
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
      const fields = modelPropertiesAccessor.getModelProperties(
        UpdateUserDto.prototype
      );
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

  describe('array of nested DTO properties', () => {
    class TagDto {
      @ApiProperty({ type: String, required: true })
      label: string;
    }

    class ArticleDto {
      @ApiProperty({ type: String, required: true })
      title: string;

      // Array expressed through a lazy factory returning a tuple.
      @ApiProperty({ type: () => [TagDto], required: true })
      lazyTags: TagDto[];

      // Array expressed through a tuple literal.
      @ApiProperty({ type: [TagDto], required: true })
      tupleTags: TagDto[];
    }

    it('should preserve array-ness for a lazy factory returning a tuple', () => {
      class UpdateArticleDto extends DeepPartialType(ArticleDto) {}
      const meta = getMetadata(UpdateArticleDto, 'lazyTags');

      expect(meta.isArray).toBe(true);
      expect(meta.required).toBe(false);
      // Type is the wrapped nested partial, not the original TagDto.
      expect(meta.type).not.toBe(TagDto);
      expect(typeof meta.type).toBe('function');
      expect(
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          meta.type.prototype,
          'label'
        ).required
      ).toBe(false);
    });

    it('should preserve array-ness for a tuple literal type', () => {
      class UpdateArticleDto extends DeepPartialType(ArticleDto) {}
      const meta = getMetadata(UpdateArticleDto, 'tupleTags');

      expect(meta.isArray).toBe(true);
      expect(meta.required).toBe(false);
      expect(meta.type).not.toBe(TagDto);
    });
  });

  describe('plugin-generated metadata', () => {
    class PluginAddressDto {
      street: string;
      city: string;

      static [METADATA_FACTORY_NAME]() {
        return {
          street: { required: true, type: () => String },
          city: { required: true, type: () => String }
        };
      }
    }

    class PluginProfileDto {
      bio: string;
      address: PluginAddressDto;

      static [METADATA_FACTORY_NAME]() {
        return {
          bio: { required: true, type: () => String },
          address: { required: true, type: () => PluginAddressDto }
        };
      }
    }

    class PluginUserDto {
      name: string;
      profile: PluginProfileDto;

      static [METADATA_FACTORY_NAME]() {
        return {
          name: { required: true, type: () => String },
          profile: { required: true, type: () => PluginProfileDto }
        };
      }
    }

    class UpdatePluginUserDto extends DeepPartialType(PluginUserDto) {}

    beforeAll(() => {
      modelPropertiesAccessor.applyMetadataFactory(
        UpdatePluginUserDto.prototype
      );
    });

    it('should mark plugin-declared top-level properties as optional', () => {
      expect(getMetadata(UpdatePluginUserDto, 'name').required).toBe(false);
      expect(getMetadata(UpdatePluginUserDto, 'profile').required).toBe(false);
    });

    it('should leave plugin-declared primitive types unchanged', () => {
      const nameMeta = getMetadata(UpdatePluginUserDto, 'name');
      expect(typeof nameMeta.type).toBe('function');
      expect(nameMeta.type()).toBe(String);
    });

    it('should wrap nested DTOs declared only in the metadata factory', () => {
      const NestedProfileType = getMetadata(
        UpdatePluginUserDto,
        'profile'
      ).type;

      expect(NestedProfileType).not.toBe(PluginProfileDto);

      const bioMeta = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        NestedProfileType.prototype,
        'bio'
      );
      expect(bioMeta.required).toBe(false);
    });

    it('should recursively wrap deeply nested plugin DTOs', () => {
      const NestedProfileType = getMetadata(
        UpdatePluginUserDto,
        'profile'
      ).type;
      const NestedAddressType = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        NestedProfileType.prototype,
        'address'
      ).type;

      expect(NestedAddressType).not.toBe(PluginAddressDto);

      const streetMeta = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        NestedAddressType.prototype,
        'street'
      );
      expect(streetMeta.required).toBe(false);
    });
  });

  describe('plugin-generated arrays', () => {
    class PluginTagDto {
      label: string;

      static [METADATA_FACTORY_NAME]() {
        return { label: { required: true, type: () => String } };
      }
    }

    class PluginArticleDto {
      tags: PluginTagDto[];

      static [METADATA_FACTORY_NAME]() {
        return { tags: { required: true, type: () => [PluginTagDto] } };
      }
    }

    it('should preserve array-ness for a plugin-declared nested DTO array', () => {
      class UpdatePluginArticleDto extends DeepPartialType(PluginArticleDto) {}
      const meta = getMetadata(UpdatePluginArticleDto, 'tags');

      expect(meta.isArray).toBe(true);
      expect(meta.required).toBe(false);
      expect(meta.type).not.toBe(PluginTagDto);
      expect(
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          meta.type.prototype,
          'label'
        ).required
      ).toBe(false);
    });
  });

  describe('lazy factory that throws', () => {
    it('should leave the property type alone instead of propagating the error', () => {
      class ThrowingPluginDto {
        broken: unknown;

        static [METADATA_FACTORY_NAME]() {
          return {
            broken: {
              required: true,
              type: () => {
                throw new Error('circular import not resolved yet');
              }
            }
          };
        }
      }

      expect(() => DeepPartialType(ThrowingPluginDto)).not.toThrow();
    });

    it('should leave an explicitly decorated throwing factory alone', () => {
      class ThrowingExplicitDto {
        @ApiProperty({
          type: () => {
            throw new Error('circular import not resolved yet');
          }
        })
        broken: unknown;
      }

      expect(() => DeepPartialType(ThrowingExplicitDto)).not.toThrow();
    });
  });

  describe('mixed explicit and plugin-generated metadata', () => {
    class MixedTagDto {
      @ApiProperty({ type: String, required: true })
      label: string;
    }

    class MixedSettingsDto {
      theme: string;

      static [METADATA_FACTORY_NAME]() {
        return { theme: { required: true, type: () => String } };
      }
    }

    class MixedAccountDto {
      @ApiProperty({ type: () => MixedTagDto, required: true })
      tag: MixedTagDto;

      settings: MixedSettingsDto;

      static [METADATA_FACTORY_NAME]() {
        return {
          settings: { required: true, type: () => MixedSettingsDto }
        };
      }
    }

    class UpdateMixedAccountDto extends DeepPartialType(MixedAccountDto) {}

    beforeAll(() => {
      modelPropertiesAccessor.applyMetadataFactory(
        UpdateMixedAccountDto.prototype
      );
    });

    it('should wrap the explicitly decorated nested DTO', () => {
      const meta = getMetadata(UpdateMixedAccountDto, 'tag');

      expect(meta.required).toBe(false);
      expect(meta.type).not.toBe(MixedTagDto);
      expect(
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          meta.type.prototype,
          'label'
        ).required
      ).toBe(false);
    });

    it('should wrap the plugin-declared nested DTO on the same class', () => {
      const meta = getMetadata(UpdateMixedAccountDto, 'settings');

      expect(meta.required).toBe(false);
      expect(meta.type).not.toBe(MixedSettingsDto);
      expect(
        Reflect.getMetadata(
          DECORATORS.API_MODEL_PROPERTIES,
          meta.type.prototype,
          'theme'
        ).required
      ).toBe(false);
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

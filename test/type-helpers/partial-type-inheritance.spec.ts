import { Type } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiProperty } from '../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { SchemasObject } from '../../lib/interfaces/open-api-spec.interface';
import { PartialType } from '../../lib/type-helpers';

describe('PartialType with extended class DTOs', () => {
  const modelPropertiesAccessor = new ModelPropertiesAccessor();

  describe('when a class extends PartialType(BaseClass) and adds its own @ApiProperty properties', () => {
    class ClassADto {
      @ApiProperty()
      propA: string;
    }

    class ClassBDto extends PartialType(ClassADto) {
      @ApiProperty()
      propB: string;
    }

    it('should include properties from both the parent and child class', () => {
      const prototype = ClassBDto.prototype as any as Type<unknown>;
      const properties = modelPropertiesAccessor.getModelProperties(prototype);
      expect(properties).toContain('propA');
      expect(properties).toContain('propB');
    });

    it('should mark parent properties as optional (required: false)', () => {
      const prototype = ClassBDto.prototype as any as Type<unknown>;
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        prototype,
        'propA'
      );
      expect(metadata).toBeDefined();
      expect(metadata.required).toBe(false);
    });
  });

  describe('when parent class uses only plugin metadata (no @ApiProperty decorators)', () => {
    // This is the core issue from #3333: parent properties from plugin metadata
    // must be discoverable by child classes extending PartialType(Parent)
    class PluginOnlyParent {
      propFromParent: string;

      static [METADATA_FACTORY_NAME]() {
        return {
          propFromParent: { required: true, type: () => String }
        };
      }
    }

    class ChildOfPartialPlugin extends PartialType(PluginOnlyParent) {
      @ApiProperty()
      childProp: string;
    }

    it('should include plugin-based parent properties in the child prototype chain', () => {
      const prototype =
        ChildOfPartialPlugin.prototype as any as Type<unknown>;
      const properties = modelPropertiesAccessor.getModelProperties(prototype);
      // After fix: plugin properties are eagerly applied as ApiProperty decorators
      // on PartialTypeClass.prototype, making them discoverable via prototype chain
      expect(properties).toContain('propFromParent');
      expect(properties).toContain('childProp');
    });

    it('should mark plugin parent properties as optional', () => {
      const prototype =
        ChildOfPartialPlugin.prototype as any as Type<unknown>;
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        prototype,
        'propFromParent'
      );
      expect(metadata).toBeDefined();
      expect(metadata.required).toBe(false);
    });
  });

  describe('when both parent and child use only plugin metadata', () => {
    class PluginParent {
      parentProp: string;

      static [METADATA_FACTORY_NAME]() {
        return {
          parentProp: { required: true, type: () => String }
        };
      }
    }

    class PluginChild extends PartialType(PluginParent) {
      childProp: number;

      static [METADATA_FACTORY_NAME]() {
        return {
          childProp: { required: true, type: () => Number }
        };
      }
    }

    it('should include properties from both parent and child after applyMetadataFactory', () => {
      const prototype = PluginChild.prototype as any as Type<unknown>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      const properties = modelPropertiesAccessor.getModelProperties(prototype);
      expect(properties).toContain('parentProp');
      expect(properties).toContain('childProp');
    });

    it('should mark parent properties as optional', () => {
      const prototype = PluginChild.prototype as any as Type<unknown>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        prototype,
        'parentProp'
      );
      expect(metadata).toBeDefined();
      expect(metadata.required).toBe(false);
    });
  });

  describe('when metadata is loaded via MetadataLoader (SWC readonly mode)', () => {
    class LazyParent {
      parentProp: string;
    }

    class LazyChild extends PartialType(LazyParent) {
      @ApiProperty({ type: String })
      childProp: string;
    }

    it('should include parent properties after metadata is loaded', async () => {
      const metadataLoader = new MetadataLoader();

      const SERIALIZED_METADATA = {
        '@nestjs/swagger': {
          models: [
            [
              Promise.resolve({ LazyParent }),
              {
                LazyParent: {
                  parentProp: { required: true, type: () => String }
                }
              }
            ]
          ]
        }
      };

      await metadataLoader.load(SERIALIZED_METADATA);

      const prototype = LazyChild.prototype as any as Type<unknown>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      const properties = modelPropertiesAccessor.getModelProperties(prototype);

      expect(properties).toContain('parentProp');
      expect(properties).toContain('childProp');
    });

    it('should mark parent properties as optional after metadata is loaded', async () => {
      const metadataLoader = new MetadataLoader();

      const SERIALIZED_METADATA = {
        '@nestjs/swagger': {
          models: [
            [
              Promise.resolve({ LazyParent }),
              {
                LazyParent: {
                  parentProp: { required: true, type: () => String }
                }
              }
            ]
          ]
        }
      };

      await metadataLoader.load(SERIALIZED_METADATA);

      const prototype = LazyChild.prototype as any as Type<unknown>;
      modelPropertiesAccessor.applyMetadataFactory(prototype);
      const metadata = Reflect.getMetadata(
        DECORATORS.API_MODEL_PROPERTIES,
        prototype,
        'parentProp'
      );
      expect(metadata).toBeDefined();
      expect(metadata.required).toBe(false);
    });
  });

  describe('schema generation with SchemaObjectFactory', () => {
    let schemaObjectFactory: SchemaObjectFactory;

    beforeEach(() => {
      const accessor = new ModelPropertiesAccessor();
      const mapper = new SwaggerTypesMapper();
      schemaObjectFactory = new SchemaObjectFactory(accessor, mapper);
    });

    it('should generate schema with all properties for class extending PartialType with plugin metadata', () => {
      class PluginBase {
        baseProp: string;

        static [METADATA_FACTORY_NAME]() {
          return {
            baseProp: { required: true, type: () => String }
          };
        }
      }

      class PluginChild extends PartialType(PluginBase) {
        childProp: string;

        static [METADATA_FACTORY_NAME]() {
          return {
            childProp: { required: true, type: () => String }
          };
        }
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(PluginChild, schemas);

      expect(schemas['PluginChild']).toBeDefined();
      expect(schemas['PluginChild'].properties).toHaveProperty('baseProp');
      expect(schemas['PluginChild'].properties).toHaveProperty('childProp');
    });

    it('should mark parent properties as not required in schema', () => {
      class BaseDto {
        @ApiProperty({ type: String, required: true })
        baseProp: string;
      }

      class ChildDto extends PartialType(BaseDto) {
        @ApiProperty({ type: String, required: true })
        childProp: string;
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(ChildDto, schemas);

      const required = schemas['ChildDto'].required || [];
      expect(required).toContain('childProp');
      expect(required).not.toContain('baseProp');
    });

    it('should handle deep inheritance chains', () => {
      class GrandParent {
        grandProp: string;
        static [METADATA_FACTORY_NAME]() {
          return { grandProp: { required: true, type: () => String } };
        }
      }

      class Parent extends GrandParent {
        parentProp: string;
        static [METADATA_FACTORY_NAME]() {
          return { parentProp: { required: true, type: () => String } };
        }
      }

      class Child extends PartialType(Parent) {
        childProp: string;
        static [METADATA_FACTORY_NAME]() {
          return { childProp: { required: true, type: () => String } };
        }
      }

      const schemas: Record<string, SchemasObject> = {};
      schemaObjectFactory.exploreModelSchema(Child, schemas);

      expect(schemas['Child']).toBeDefined();
      expect(schemas['Child'].properties).toHaveProperty('grandProp');
      expect(schemas['Child'].properties).toHaveProperty('parentProp');
      expect(schemas['Child'].properties).toHaveProperty('childProp');

      const required = schemas['Child'].required || [];
      expect(required).toContain('childProp');
      expect(required).not.toContain('grandProp');
      expect(required).not.toContain('parentProp');
    });
  });
});

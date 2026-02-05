import 'reflect-metadata';
import { DECORATORS } from '../../lib/constants';
import { ApiTags } from '../../lib/decorators/api-use-tags.decorator';

describe('ApiTags', () => {
  describe('with string arguments (backward compatibility)', () => {
    class TestController {
      @ApiTags('Cats')
      singleTag() {}

      @ApiTags('Cats', 'Pets')
      multipleTags() {}
    }

    it('should store single string tag', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.singleTag
      );
      expect(tags).toEqual(['Cats']);
    });

    it('should store multiple string tags', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.multipleTags
      );
      expect(tags).toEqual(['Cats', 'Pets']);
    });
  });

  describe('with object arguments', () => {
    class TestController {
      @ApiTags({ name: 'Cats' })
      objectTag() {}

      @ApiTags({ name: 'Cats', parent: 'Animals' })
      objectWithParent() {}

      @ApiTags({ name: 'Internal', kind: 'reference' })
      objectWithKind() {}

      @ApiTags({ name: 'Cats', parent: 'Animals', kind: 'navigation' })
      objectWithBoth() {}
    }

    it('should extract name from object tag', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.objectTag
      );
      expect(tags).toEqual(['Cats']);
    });

    it('should extract name from object with parent', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.objectWithParent
      );
      expect(tags).toEqual(['Cats']);
    });

    it('should extract name from object with kind', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.objectWithKind
      );
      expect(tags).toEqual(['Internal']);
    });

    it('should extract name from object with parent and kind', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.objectWithBoth
      );
      expect(tags).toEqual(['Cats']);
    });
  });

  describe('with mixed string and object arguments', () => {
    class TestController {
      @ApiTags('Dogs', { name: 'Cats' })
      mixed() {}

      @ApiTags({ name: 'Cats', parent: 'Animals' }, 'Dogs', { name: 'Birds' })
      complexMixed() {}
    }

    it('should handle mixed string and object tags', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.mixed
      );
      expect(tags).toEqual(['Dogs', 'Cats']);
    });

    it('should handle complex mixed tags', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        TestController.prototype.complexMixed
      );
      expect(tags).toEqual(['Cats', 'Dogs', 'Birds']);
    });
  });

  describe('applied on class', () => {
    @ApiTags('Cats')
    class StringTagController {}

    @ApiTags({ name: 'Dogs', parent: 'Animals' })
    class ObjectTagController {}

    @ApiTags('Birds', { name: 'Cats', parent: 'Animals' })
    class MixedTagController {}

    it('should store string tag on class', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        StringTagController
      );
      expect(tags).toEqual(['Cats']);
    });

    it('should store object tag name on class', () => {
      const tags = Reflect.getMetadata(
        DECORATORS.API_TAGS,
        ObjectTagController
      );
      expect(tags).toEqual(['Dogs']);
    });

    it('should store mixed tags on class', () => {
      const tags = Reflect.getMetadata(DECORATORS.API_TAGS, MixedTagController);
      expect(tags).toEqual(['Birds', 'Cats']);
    });
  });
});

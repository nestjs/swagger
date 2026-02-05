import 'reflect-metadata';
import { ApiTags } from '../../lib/decorators/api-use-tags.decorator';
import {
  exploreApiTagsMetadata,
  exploreGlobalApiTagsMetadata
} from '../../lib/explorers/api-use-tags.explorer';

describe('api-use-tags.explorer', () => {
  describe('exploreGlobalApiTagsMetadata', () => {
    describe('with string tags', () => {
      @ApiTags('Cats')
      class StringTagController {
        findAll() {}
      }

      it('should return tags from string-based @ApiTags', () => {
        const result = exploreGlobalApiTagsMetadata(false)(StringTagController);
        expect(result).toEqual({ tags: ['Cats'] });
      });
    });

    describe('with object tags (normalized to strings)', () => {
      @ApiTags({ name: 'Dogs', parent: 'Animals' })
      class ObjectTagController {
        findAll() {}
      }

      it('should return normalized tag names from object-based @ApiTags', () => {
        const result = exploreGlobalApiTagsMetadata(false)(ObjectTagController);
        expect(result).toEqual({ tags: ['Dogs'] });
      });
    });

    describe('with mixed tags (normalized to strings)', () => {
      @ApiTags('Birds', { name: 'Cats', parent: 'Animals' })
      class MixedTagController {
        findAll() {}
      }

      it('should return normalized tag names from mixed @ApiTags', () => {
        const result = exploreGlobalApiTagsMetadata(false)(MixedTagController);
        expect(result).toEqual({ tags: ['Birds', 'Cats'] });
      });
    });

    describe('with autoTagControllers', () => {
      class UntaggedController {
        findAll() {}
      }

      it('should return controller name as default tag when no tags defined', () => {
        const result = exploreGlobalApiTagsMetadata(true)(UntaggedController);
        expect(result).toEqual({ tags: ['Untagged'] });
      });
    });

    describe('without tags', () => {
      class NoTagsController {
        findAll() {}
      }

      it('should return undefined when no tags and autoTagControllers is false', () => {
        const result = exploreGlobalApiTagsMetadata(false)(NoTagsController);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('exploreApiTagsMetadata', () => {
    describe('with string tags on method', () => {
      class TestController {
        @ApiTags('Cats')
        findAll() {}
      }

      it('should return tags from method', () => {
        const instance = new TestController();
        const result = exploreApiTagsMetadata(
          instance,
          TestController,
          instance.findAll
        );
        expect(result).toEqual(['Cats']);
      });
    });

    describe('with object tags on method (normalized)', () => {
      class TestController {
        @ApiTags({ name: 'Dogs', parent: 'Animals' })
        findAll() {}
      }

      it('should return normalized tag names from method', () => {
        const instance = new TestController();
        const result = exploreApiTagsMetadata(
          instance,
          TestController,
          instance.findAll
        );
        expect(result).toEqual(['Dogs']);
      });
    });

    describe('with mixed tags on method (normalized)', () => {
      class TestController {
        @ApiTags('Birds', {
          name: 'Cats',
          parent: 'Animals',
          kind: 'navigation'
        })
        findAll() {}
      }

      it('should return normalized tag names from method', () => {
        const instance = new TestController();
        const result = exploreApiTagsMetadata(
          instance,
          TestController,
          instance.findAll
        );
        expect(result).toEqual(['Birds', 'Cats']);
      });
    });

    describe('without tags on method', () => {
      class TestController {
        findAll() {}
      }

      it('should return undefined when no tags on method', () => {
        const instance = new TestController();
        const result = exploreApiTagsMetadata(
          instance,
          TestController,
          instance.findAll
        );
        expect(result).toBeUndefined();
      });
    });
  });
});

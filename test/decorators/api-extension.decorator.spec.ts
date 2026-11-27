import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiExtension } from '../../lib/decorators';

describe('ApiExtension', () => {
  describe('when applied on the class level', () => {
    @ApiExtension('x-controller-extension', { test: 'value' })
    @Controller('test')
    class TestAppController {
      @Get()
      public get(): string {
        return 'test';
      }

      @Post()
      public post(@Body() body: any): string {
        return 'created';
      }

      public noApiMethod(): void {}
    }

    it('should attach metadata to the class', () => {
      expect(
        Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, TestAppController)
      ).toEqual({ 'x-controller-extension': { test: 'value' } });
    });

    it('should not copy metadata onto the API methods', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toBeFalsy();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.post)
      ).toBeFalsy();
    });

    it('should not attach metadata to non-API method (not a route)', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.noApiMethod)
      ).toBeFalsy();
    });
  });

  describe('when applied on the method level', () => {
    @Controller('test')
    class TestAppController {
      @Get()
      @ApiExtension('x-method-extension', { method: 'specific' })
      public get(): string {
        return 'test';
      }

      @Post()
      public post(@Body() body: any): string {
        return 'created';
      }
    }

    it('should attach metadata to a given method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({ 'x-method-extension': { method: 'specific' } });
    });

    it('should not attach metadata to methods without the decorator', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.post)
      ).toBeFalsy();
    });
  });

  describe('when applied multiple times', () => {
    @Controller('test')
    class TestAppController {
      @Get()
      @ApiExtension('x-first-extension', { first: 'value' })
      @ApiExtension('x-second-extension', { second: 'value' })
      public get(): string {
        return 'test';
      }
    }

    it('should merge multiple extensions', () => {
      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({
        'x-first-extension': { first: 'value' },
        'x-second-extension': { second: 'value' }
      });
    });
  });

  describe('when combining extensions from class and method level', () => {
    @ApiExtension('x-class-extension', { class: 'level' })
    @Controller('test')
    class TestAppController {
      @Get()
      @ApiExtension('x-method-extension', { method: 'level' })
      public get(): string {
        return 'test';
      }

      @Post()
      public post(@Body() body: any): string {
        return 'created';
      }
    }

    it('should keep class and method level extensions apart', () => {
      const controller = new TestAppController();
      expect(
        Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, TestAppController)
      ).toEqual({ 'x-class-extension': { class: 'level' } });
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({ 'x-method-extension': { method: 'level' } });
    });

    it('should not attach metadata to methods without method decorator', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.post)
      ).toBeFalsy();
    });
  });

  describe('when combining class and method level values', () => {
    @ApiExtension('x-extension', { class: 'level' })
    @Controller('test')
    class TestAppController {
      @Get()
      @ApiExtension('x-extension', { method: 'level' })
      public get(): string {
        return 'test';
      }

      @Post()
      public post(@Body() body: any): string {
        return 'created';
      }
    }

    it('should keep the method level value on the method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({
        'x-extension': { method: 'level' }
      });
    });

    it('should keep the class level value on the class', () => {
      const controller = new TestAppController();
      expect(
        Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, TestAppController)
      ).toEqual({
        'x-extension': { class: 'level' }
      });
      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, controller.post)
      ).toBeFalsy();
    });
  });

  describe('extension key validation', () => {
    it('should throw an error if extension key does not start with "x-"', () => {
      expect(() => {
        @ApiExtension('invalid-key', { test: 'value' })
        @Controller('test')
        class TestController {
          @Get()
          public get(): string {
            return 'test';
          }
        }
      }).toThrow(
        'Extension key is not prefixed. Please ensure you prefix it with `x-`.'
      );
    });

    it('should accept extension key that starts with "x-"', () => {
      expect(() => {
        @ApiExtension('x-valid-key', { test: 'value' })
        @Controller('test')
        class TestController {
          @Get()
          public get(): string {
            return 'test';
          }
        }
      }).not.toThrow();
    });
  });

  describe('extension properties cloning', () => {
    it('should shallow clone extension properties (top-level properties are cloned)', () => {
      const originalProperties = {
        topLevel: 'original',
        nested: { value: 'original' }
      };

      @Controller('test')
      class TestAppController {
        @Get()
        @ApiExtension('x-clone-test', originalProperties)
        public get(): string {
          return 'test';
        }
      }

      const controller = new TestAppController();
      const metadata = Reflect.getMetadata(
        DECORATORS.API_EXTENSION,
        controller.get
      );

      // Modify top-level property in metadata
      metadata['x-clone-test'].topLevel = 'modified';

      // Verify the original object's top-level property wasn't affected (shallow clone works)
      expect(originalProperties.topLevel).toBe('original');

      // Modify nested property in metadata
      metadata['x-clone-test'].nested.value = 'modified';

      // Verify the original object's nested property WAS affected (shallow clone limitation)
      expect(originalProperties.nested.value).toBe('modified');
    });

    it('should clone extension properties when applied to multiple methods', () => {
      const sharedProperties = { counter: 0 };

      @Controller('test')
      class TestAppController {
        @Get('first')
        @ApiExtension('x-shared', sharedProperties)
        public getFirst(): string {
          return 'first';
        }

        @Get('second')
        @ApiExtension('x-shared', sharedProperties)
        public getSecond(): string {
          return 'second';
        }
      }

      const controller = new TestAppController();
      const firstMetadata = Reflect.getMetadata(
        DECORATORS.API_EXTENSION,
        controller.getFirst
      );
      const secondMetadata = Reflect.getMetadata(
        DECORATORS.API_EXTENSION,
        controller.getSecond
      );

      // Modify one method's metadata
      firstMetadata['x-shared'].counter = 1;

      // Verify the other method's metadata wasn't affected (each gets its own clone)
      expect(secondMetadata['x-shared'].counter).toBe(0);

      // Verify the original object wasn't affected (top-level property is cloned)
      expect(sharedProperties.counter).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty extension properties', () => {
      @Controller('test')
      class TestAppController {
        @Get()
        @ApiExtension('x-empty', {})
        public get(): string {
          return 'test';
        }
      }

      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({ 'x-empty': {} });
    });

    it('should handle null extension properties', () => {
      @Controller('test')
      class TestAppController {
        @Get()
        @ApiExtension('x-null', null)
        public get(): string {
          return 'test';
        }
      }

      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({ 'x-null': null });
    });

    it('should handle array extension properties', () => {
      @Controller('test')
      class TestAppController {
        @Get()
        @ApiExtension('x-array', ['item1', 'item2'])
        public get(): string {
          return 'test';
        }
      }

      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.get)
      ).toEqual({ 'x-array': ['item1', 'item2'] });
    });

    it('should handle primitive extension properties', () => {
      @Controller('test')
      class TestAppController {
        @Get()
        @ApiExtension('x-string', 'simple string')
        public getString(): string {
          return 'test';
        }

        @Post()
        @ApiExtension('x-number', 42)
        public getNumber(): string {
          return 'test';
        }
      }

      const controller = new TestAppController();
      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.getString)
      ).toEqual({ 'x-string': 'simple string' });

      expect(
        Reflect.getMetadata(DECORATORS.API_EXTENSION, controller.getNumber)
      ).toEqual({ 'x-number': 42 });
    });

    it('should work with controllers that have no API methods', () => {
      expect(() => {
        @ApiExtension('x-no-api-methods', { test: 'value' })
        @Controller('test')
        class TestAppController {
          public regularMethod(): void {}
          private privateMethod(): void {}
        }
      }).not.toThrow();
    });
  });

  describe('when applied to non-controller classes (DTOs/schemas)', () => {
    it('should attach metadata to the class itself', () => {
      @ApiExtension('x-schema-extension', { schema: 'metadata' })
      class TestDto {
        name: string;
        age: number;
      }

      expect(
        Reflect.hasMetadata(DECORATORS.API_EXTENSION, TestDto)
      ).toBeTruthy();
      expect(Reflect.getMetadata(DECORATORS.API_EXTENSION, TestDto)).toEqual({
        'x-schema-extension': { schema: 'metadata' }
      });
    });

    it('should merge multiple extensions on the same class', () => {
      @ApiExtension('x-first-schema', { first: 'value' })
      @ApiExtension('x-second-schema', { second: 'value' })
      class TestDto {
        name: string;
      }

      expect(Reflect.getMetadata(DECORATORS.API_EXTENSION, TestDto)).toEqual({
        'x-first-schema': { first: 'value' },
        'x-second-schema': { second: 'value' }
      });
    });

    it("should store only a subclass's own extensions on the subclass", () => {
      @ApiExtension('x-schema', 'base')
      @ApiExtension('x-base-only', true)
      class BaseDto {}

      @ApiExtension('x-schema', 'subclass')
      class ChildDto extends BaseDto {}

      expect(
        Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, ChildDto)
      ).toEqual({ 'x-schema': 'subclass' });
      expect(Reflect.getOwnMetadata(DECORATORS.API_EXTENSION, BaseDto)).toEqual(
        { 'x-schema': 'base', 'x-base-only': true }
      );
    });
  });
});

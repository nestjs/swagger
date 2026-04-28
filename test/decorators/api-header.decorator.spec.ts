import { Controller, Get } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiHeader } from '../../lib/decorators';

describe('ApiHeader', () => {
  describe('forwarded option fields', () => {
    @Controller('')
    class TestController {
      @ApiHeader({
        name: 'X-Simple',
        description: 'a simple header'
      })
      @Get('simple')
      simple(): void {}

      @ApiHeader({
        name: 'X-Full',
        description: 'all optional parameter fields',
        required: true,
        deprecated: true,
        allowEmptyValue: true,
        style: 'simple',
        explode: false,
        allowReserved: true
      })
      @Get('full')
      full(): void {}

      @ApiHeader({
        name: 'X-Content',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { foo: { type: 'string' } } }
          }
        }
      })
      @Get('content')
      content(): void {}

      @ApiHeader({
        name: 'X-Example',
        example: 'abc'
      })
      @Get('example')
      example(): void {}
    }

    const controller = new TestController();

    it('forwards deprecated/allowEmptyValue/style/explode/allowReserved to parameter metadata', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.full
      );

      expect(metadata).toEqual([
        {
          name: 'X-Full',
          in: 'header',
          description: 'all optional parameter fields',
          required: true,
          deprecated: true,
          allowEmptyValue: true,
          style: 'simple',
          explode: false,
          allowReserved: true,
          schema: { type: 'string' }
        }
      ]);
    });

    it('does not emit a synthetic string schema when `content` is provided', () => {
      const metadata = Reflect.getMetadata(
        DECORATORS.API_PARAMETERS,
        controller.content
      );

      expect(metadata).toEqual([
        {
          name: 'X-Content',
          in: 'header',
          content: {
            'application/json': {
              schema: { type: 'object', properties: { foo: { type: 'string' } } }
            }
          }
        }
      ]);
      expect(metadata[0]).not.toHaveProperty('schema');
    });

    it('preserves the default string schema for the simple case', () => {
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.simple)
      ).toEqual([
        {
          name: 'X-Simple',
          in: 'header',
          description: 'a simple header',
          schema: { type: 'string' }
        }
      ]);
    });

    it('keeps `example` on the generated schema', () => {
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.example)
      ).toEqual([
        {
          name: 'X-Example',
          in: 'header',
          schema: { type: 'string', example: 'abc' }
        }
      ]);
    });
  });
});

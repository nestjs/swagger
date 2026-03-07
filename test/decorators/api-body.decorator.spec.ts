import { Controller, Post } from '@nestjs/common';
import { DECORATORS } from '../../lib/constants';
import { ApiBody } from '../../lib/decorators';

describe('ApiBody', () => {
  describe('when applied on the method level', () => {
    @Controller('tests')
    class TestAppController {
      @Post()
      @ApiBody({
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        examples: {
          sample: {
            value: { name: 'test' }
          }
        },
        encoding: {
          name: { explode: true, style: 'form' }
        }
      })
      public create(): void {}
    }

    it('should attach metadata to a given method', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.create)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.create)
      ).toEqual([
        {
          in: 'body',
          required: true,
          type: String,
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            }
          },
          examples: {
            sample: {
              value: { name: 'test' }
            }
          },
          encoding: {
            name: { explode: true, style: 'form' }
          }
        }
      ]);
    });
  });

  describe('when enum array is provided', () => {
    @Controller('tests')
    class TestAppController {
      @Post()
      @ApiBody({
        enum: ['small', 'large'],
        isArray: true
      })
      public create(): void {}
    }

    it('should attach array enum schema metadata', () => {
      const controller = new TestAppController();
      expect(
        Reflect.hasMetadata(DECORATORS.API_PARAMETERS, controller.create)
      ).toBeTruthy();
      expect(
        Reflect.getMetadata(DECORATORS.API_PARAMETERS, controller.create)
      ).toEqual([
        {
          in: 'body',
          required: true,
          type: String,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['small', 'large']
            }
          }
        }
      ]);
    });
  });
});

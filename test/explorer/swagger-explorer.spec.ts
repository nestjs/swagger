import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles
} from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiDefaultResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiProperty,
  ApiQuery,
  ApiMultipart
} from '../../lib/decorators';
import { ResponseObject } from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { SwaggerExplorer } from '../../lib/swagger-explorer';
import { FileInterceptor } from '@nestjs/platform-express';

describe('SwaggerExplorer', () => {
  const schemaObjectFactory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  describe('when module only uses metadata', () => {
    class Foo {}

    class CreateFoo {}

    class ListEntitiesDto {
      @ApiProperty({ minimum: 0 })
      page: number;

      @ApiProperty()
      order: string;

      @ApiProperty({ type: [String], minItems: 3 })
      sortBy: string[];
    }

    @Controller('')
    class FooController {
      @Post('foos')
      @ApiOperation({ summary: 'Create foo' })
      @ApiCreatedResponse({
        type: Foo,
        description: 'Newly created Foo object'
      })
      create(
        @Body() createFoo: CreateFoo,
        @Query() listEntities: ListEntitiesDto
      ): Promise<Foo> {
        return Promise.resolve({});
      }

      @Get(['foos/:objectId', 'foo/:objectId'])
      @ApiOperation({ summary: 'List all Foos' })
      @ApiOkResponse({ type: [Foo] })
      find(
        @Param('objectId') objectId: string,
        @Query('page') q: string
      ): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    it('sees two controller operations and their responses', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual('FooController_create');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/foos');
      expect(routes[0].root.summary).toEqual('Create foo');
      expect(routes[0].root.parameters.length).toEqual(3);
      expect(routes[0].root.parameters).toEqual([
        {
          in: 'query',
          minimum: 0,
          name: 'page',
          required: true,
          schema: {
            type: 'number'
          }
        },
        {
          in: 'query',
          name: 'order',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'query',
          minItems: 3,
          name: 'sortBy',
          required: true,
          schema: {
            items: {
              type: 'string'
            },
            type: 'array'
          }
        }
      ]);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateFoo'
            }
          }
        }
      });

      expect(
        (routes[0].responses['201'] as ResponseObject).description
      ).toEqual('Newly created Foo object');
      expect(
        (routes[0].responses['201'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          $ref: '#/components/schemas/Foo'
        }
      });

      // GET
      expect(routes[1].root.operationId).toEqual('FooController_find');
      expect(routes[1].root.method).toEqual('get');
      expect(routes[1].root.path).toEqual('/path/foos/{objectId}');
      expect(routes[1].root.summary).toEqual('List all Foos');
      expect(routes[1].root.parameters.length).toEqual(2);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ]);
      expect(
        (routes[1].responses['200'] as ResponseObject).description
      ).toEqual('');
      expect(
        (routes[1].responses['200'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Foo'
          }
        }
      });
    });
  });
  describe('when explicit decorators and metadata are used', () => {
    class Foo {}

    class CreateFoo {}

    @Controller('')
    @ApiBadRequestResponse({ description: 'Bad request' })
    class FooController {
      @Post('foos')
      @ApiBody({ type: CreateFoo })
      @ApiOperation({ summary: 'Create foo' })
      @ApiCreatedResponse({
        type: Foo,
        description: 'Newly created Foo object'
      })
      create(@Body() createFoo: CreateFoo): Promise<Foo> {
        return Promise.resolve({});
      }

      @Get('foos/:objectId')
      @ApiParam({ name: 'objectId', type: 'string' })
      @ApiQuery({ name: 'page', type: 'string' })
      @ApiOperation({ summary: 'List all Foos' })
      @ApiOkResponse({ type: [Foo] })
      @ApiDefaultResponse({ type: [Foo] })
      find(
        @Param('objectId') objectId: string,
        @Query('page') q: string
      ): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    it('sees two controller operations and their responses', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual('FooController_create');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/foos');
      expect(routes[0].root.summary).toEqual('Create foo');
      expect(routes[0].root.parameters.length).toEqual(0);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateFoo'
            }
          }
        }
      });

      expect(
        (routes[0].responses['400'] as ResponseObject).description
      ).toEqual('Bad request');
      expect(
        (routes[0].responses['201'] as ResponseObject).description
      ).toEqual('Newly created Foo object');
      expect(
        (routes[0].responses['201'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          $ref: '#/components/schemas/Foo'
        }
      });

      // GET
      expect(routes[1].root.operationId).toEqual('FooController_find');
      expect(routes[1].root.method).toEqual('get');
      expect(routes[1].root.path).toEqual('/path/foos/{objectId}');
      expect(routes[1].root.summary).toEqual('List all Foos');
      expect(routes[1].root.parameters.length).toEqual(2);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ]);
      expect(
        (routes[1].responses['200'] as ResponseObject).description
      ).toEqual('');
      expect(
        (routes[1].responses['200'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Foo'
          }
        }
      });
      expect(
        (routes[1].responses.default as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Foo'
          }
        }
      });
    });
  });
  describe('when only explicit decorators are used', () => {
    class Foo {}

    class CreateFoo {}

    @Controller('')
    class FooController {
      @ApiConsumes('application/xml')
      @ApiProduces('application/xml')
      @Post('foos')
      @ApiBody({ type: CreateFoo })
      @ApiOperation({ summary: 'Create foo' })
      @ApiCreatedResponse({
        type: Foo,
        description: 'Newly created Foo object'
      })
      create(): Promise<Foo> {
        return Promise.resolve({});
      }

      @Get('foos/:objectId')
      @ApiParam({ name: 'objectId', type: 'string' })
      @ApiQuery({ name: 'page', type: 'string' })
      @ApiOperation({ summary: 'List all Foos' })
      @ApiOkResponse({ type: [Foo] })
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    it('sees two controller operations and their responses', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual('FooController_create');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/foos');
      expect(routes[0].root.summary).toEqual('Create foo');
      expect(routes[0].root.parameters.length).toEqual(0);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'application/xml': {
            schema: {
              $ref: '#/components/schemas/CreateFoo'
            }
          }
        }
      });

      expect(
        (routes[0].responses['201'] as ResponseObject).description
      ).toEqual('Newly created Foo object');
      expect(
        (routes[0].responses['201'] as ResponseObject).content[
          'application/xml'
        ]
      ).toEqual({
        schema: {
          $ref: '#/components/schemas/Foo'
        }
      });

      // GET
      expect(routes[1].root.operationId).toEqual('FooController_find');
      expect(routes[1].root.method).toEqual('get');
      expect(routes[1].root.path).toEqual('/path/foos/{objectId}');
      expect(routes[1].root.summary).toEqual('List all Foos');
      expect(routes[1].root.parameters.length).toEqual(2);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ]);

      expect(
        (routes[1].responses['200'] as ResponseObject).description
      ).toEqual('');
      expect(
        (routes[1].responses['200'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Foo'
          }
        }
      });
    });
  });
  describe('when custom properties are passed', () => {
    class Foo {}

    class CreateFoo {}

    @Controller('')
    class FooController {
      @ApiConsumes('application/xml')
      @Post('foos')
      @ApiBody({ type: CreateFoo })
      @ApiOperation({
        summary: 'Create foo',
        operationId: 'FooController_create2',
        description: 'Allows creating Foo item',
        tags: ['foo']
      })
      @ApiCreatedResponse({
        description: 'Newly created Foo object',
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            format: 'int32'
          }
        }
      })
      create(): Promise<Foo> {
        return Promise.resolve({});
      }

      @Get('foos/:objectId')
      @ApiParam({
        name: 'objectId',
        schema: { type: 'integer', format: 'int64', maximum: 10, minimum: 0 }
      })
      @ApiQuery({ name: 'page', type: String })
      @ApiOperation({
        summary: 'List all Foos',
        operationId: 'FooController_find2'
      })
      @ApiBody({
        schema: {
          type: 'array',
          items: {
            type: 'string',
            default: 'available',
            enum: ['available', 'pending', 'sold']
          }
        }
      })
      @ApiOkResponse({ type: [Foo] })
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }
    it('should merge implicit metadata with explicit options', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.description).toEqual('Allows creating Foo item');
      expect(routes[0].root.tags).toEqual(['foo']);
      expect(routes[0].root.operationId).toEqual('FooController_create2');
      expect(routes[0].root.parameters.length).toEqual(0);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'application/xml': {
            schema: {
              $ref: '#/components/schemas/CreateFoo'
            }
          }
        }
      });

      expect(
        (routes[0].responses['201'] as ResponseObject).description
      ).toEqual('Newly created Foo object');
      expect(
        (routes[0].responses['201'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            format: 'int32'
          }
        }
      });

      // GET
      expect(routes[1].root.operationId).toEqual('FooController_find2');
      expect(routes[1].root.parameters.length).toEqual(2);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'integer',
            format: 'int64',
            maximum: 10,
            minimum: 0
          }
        }
      ]);
      expect(routes[1].root.requestBody).toEqual({
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'string',
                default: 'available',
                enum: ['available', 'pending', 'sold']
              }
            }
          }
        }
      });
      expect(
        (routes[1].responses['200'] as ResponseObject).description
      ).toEqual('');
      expect(
        (routes[1].responses['200'] as ResponseObject).content[
          'application/json'
        ]
      ).toEqual({
        schema: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Foo'
          }
        }
      });
    });
  });
  describe('when enum is used', () => {
    enum ParamEnum {
      A = 'a',
      B = 'b',
      C = 'c'
    }

    class Foo {}

    @Controller('')
    class FooController {
      @Get('foos/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum
      })
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum
      })
      @ApiQuery({ name: 'order', enum: ['d', 'e', 'f'] })
      @ApiQuery({ name: 'page', enum: ['d', 'e', 'f'], isArray: true })
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }
    it('should properly define enums', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['d', 'e', 'f']
            }
          }
        },
        {
          in: 'query',
          name: 'order',
          required: true,
          schema: {
            type: 'string',
            enum: ['d', 'e', 'f']
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string',
            enum: ['a', 'b', 'c']
          }
        }
      ]);
    });
  });

  describe('when headers are defined', () => {
    class Foo {}

    @ApiHeader({
      name: 'Authorization',
      description: 'auth token'
    })
    @Controller('')
    class FooController {
      @ApiHeader({
        name: 'X-Rate-Limit',
        description: 'calls per hour allowed by the user'
      })
      @Get('foos/:objectId')
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }

      @Post('foos')
      create(): Promise<any> {
        return Promise.resolve();
      }
    }
    it('should properly define headers', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes[0].root.parameters).toEqual([
        {
          description: 'auth token',
          name: 'Authorization',
          in: 'header',
          schema: {
            type: 'string'
          }
        },
        {
          description: 'calls per hour allowed by the user',
          name: 'X-Rate-Limit',
          in: 'header',
          schema: {
            type: 'string'
          }
        }
      ]);
      expect(routes[1].root.parameters).toEqual([
        {
          description: 'auth token',
          name: 'Authorization',
          in: 'header',
          schema: {
            type: 'string'
          }
        }
      ]);
    });
  });

  describe('When custom api body is given', () => {
    @Controller('')
    class FooController {
      @Post('upload')
      @ApiConsumes('multipart/form-data')
      @UseInterceptors(FileInterceptor('file'))
      @ApiBody({
        type: 'multipart/form-data',
        required: true,
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary'
            }
          }
        }
      })
      uploadFile(@UploadedFile() file) {
        return file;
      }
    }

    it('Should have responseBody', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(1);

      // POST
      expect(routes[0].root.operationId).toEqual('FooController_uploadFile');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/upload');
      expect(routes[0].root.parameters.length).toEqual(0);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      });
    });
  });

  describe('When ApiMultipart is given', () => {
    @Controller('')
    class FooController {
      @Post('upload')
      @ApiConsumes('multipart/form-data')
      @UseInterceptors(FileInterceptor('file'))
      @ApiMultipart({
        binaryFiles: [{ name: 'file1' }, { name: 'file2' }]
      })
      uploadFile(@UploadedFiles() files) {
        return files;
      }
    }

    it('Should have responseBody', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path'
      );

      expect(routes.length).toEqual(1);

      // POST
      expect(routes[0].root.operationId).toEqual('FooController_uploadFile');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/upload');
      expect(routes[0].root.parameters.length).toEqual(0);
      expect(routes[0].root.requestBody).toEqual({
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file1: {
                  type: 'string',
                  format: 'binary'
                },
                file2: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      });
    });
  });
});

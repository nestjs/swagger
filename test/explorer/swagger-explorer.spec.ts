import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
  ApiResponse
} from '../../lib/decorators';
import { DenormalizedDoc } from '../../lib/interfaces/denormalized-doc.interface';
import { ResponseObject } from '../../lib/interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { SwaggerExplorer } from '../../lib/swagger-explorer';

describe('SwaggerExplorer', () => {
  const schemaObjectFactory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  const methodKeyOperationIdFactory = (_, methodKey: string) => methodKey;
  const controllerKeyMethodKeyOperationIdFactory = (
    controllerKey: string,
    methodKey: string
  ) => `${controllerKey}.${methodKey}`;

  describe('when module only uses metadata', () => {
    class Foo {}

    class CreateFoo {}

    enum LettersEnum {
      A = 'A',
      B = 'B',
      C = 'C'
    }

    class ListEntitiesDto {
      @ApiProperty({ minimum: 0 })
      page: number;

      @ApiProperty()
      order: string;

      @ApiProperty({ type: [String], minItems: 3 })
      sortBy: string[];

      @ApiProperty({
        enum: LettersEnum,
        enumName: 'LettersEnum'
      })
      enum: LettersEnum;

      @ApiProperty({
        enum: LettersEnum,
        enumName: 'LettersEnum',
        isArray: true
      })
      enumArr: LettersEnum;
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
      const operationPrefix = 'FooController_';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        methodKeyOperationIdFactory
      );
      const operationPrefix = '';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return controllerKey.methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        controllerKeyMethodKeyOperationIdFactory
      );
      const operationPrefix = 'FooController.';

      validateRoutes(routes, operationPrefix);
    });

    const validateRoutes = (
      routes: DenormalizedDoc[],
      operationPrefix: string
    ) => {
      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual(operationPrefix + 'create');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/path/foos');
      expect(routes[0].root.summary).toEqual('Create foo');
      expect(routes[0].root.parameters.length).toEqual(5);
      expect(routes[0].root.parameters).toEqual([
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            minimum: 0,
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
          name: 'sortBy',
          required: true,
          schema: {
            minItems: 3,
            items: {
              type: 'string'
            },
            type: 'array'
          }
        },
        {
          in: 'query',
          name: 'enum',
          required: true,
          schema: {
            $ref: '#/components/schemas/LettersEnum'
          }
        },
        {
          in: 'query',
          name: 'enumArr',
          required: true,
          schema: {
            items: {
              $ref: '#/components/schemas/LettersEnum'
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
      expect(routes[1].root.operationId).toEqual(operationPrefix + 'find');
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
    };
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
      const prefix = 'FooController_';

      validateRoutes(routes, prefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        methodKeyOperationIdFactory
      );
      const prefix = '';

      validateRoutes(routes, prefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return controllerKey.methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        controllerKeyMethodKeyOperationIdFactory
      );
      const prefix = 'FooController.';

      validateRoutes(routes, prefix);
    });

    const validateRoutes = (
      routes: DenormalizedDoc[],
      operationPrefix: string
    ) => {
      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual(operationPrefix + 'create');
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
      expect(routes[1].root.operationId).toEqual(operationPrefix + 'find');
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
    };
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
      const operationPrefix = 'FooController_';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        methodKeyOperationIdFactory
      );
      const operationPrefix = '';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return controllerKey.methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined,
        undefined,
        controllerKeyMethodKeyOperationIdFactory
      );
      const operationPrefix = 'FooController.';

      validateRoutes(routes, operationPrefix);
    });

    const validateRoutes = (
      routes: DenormalizedDoc[],
      operationPrefix: string
    ) => {
      expect(routes.length).toEqual(2);

      // POST
      expect(routes[0].root.operationId).toEqual(operationPrefix + 'create');
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
      expect(routes[1].root.operationId).toEqual(operationPrefix + 'find');
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
    };
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

      validateRoutes(routes);
    });

    it('should merge implicit metadata with explicit options and use default operationIdFactory', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        undefined
      );

      validateRoutes(routes);
    });

    const validateRoutes = (routes: DenormalizedDoc[]) => {
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
    };
  });
  describe('when enum is used', () => {
    enum ParamEnum {
      A = 'a',
      B = 'b',
      C = 'c'
    }

    enum QueryEnum {
      D = 'd',
      E = 'e',
      F = 'f'
    }

    class Foo {}

    @Controller('')
    class FooController {
      @Get('foos/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum
      })
      @ApiQuery({ name: 'order', enum: QueryEnum })
      @ApiQuery({ name: 'page', enum: ['d', 'e', 'f'], isArray: true })
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    @Controller('')
    class BarController {
      @Get('bars/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum,
        enumName: 'ParamEnum'
      })
      @ApiQuery({ name: 'order', enum: QueryEnum, enumName: 'QueryEnum' })
      @ApiQuery({
        name: 'page',
        enum: QueryEnum,
        enumName: 'QueryEnum',
        isArray: true
      })
      findBar(): Promise<Foo> {
        return Promise.resolve(null);
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

    it('should properly define enum as schema with lazy function', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new BarController(),
          metatype: BarController
        } as InstanceWrapper<BarController>,
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
              $ref: '#/components/schemas/QueryEnum'
            }
          }
        },
        {
          in: 'query',
          name: 'order',
          required: true,
          schema: {
            $ref: '#/components/schemas/QueryEnum'
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            $ref: '#/components/schemas/ParamEnum'
          }
        }
      ]);
    });
  });

  describe('when headers are defined', () => {
    class Foo {}

    @ApiHeader({
      name: 'Authorization',
      description: 'auth token',
      schema: {
        default: 'default token'
      }
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
            default: 'default token',
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
            default: 'default token',
            type: 'string'
          }
        }
      ]);
    });
  });
  describe('when global responses defined', () => {
    @Controller('')
    @ApiResponse({
      status: 500,
      description: '500 - controller error response'
    })
    @ApiResponse({
      status: 502,
      description: '502 - controller error response'
    })
    class FooController {
      @Post('foos')
      @ApiResponse({
        status: 200,
        description: '200 - method response'
      })
      @ApiResponse({
        status: 500,
        description: '500 - method error response'
      })
      get(): Promise<any> {
        return Promise.resolve({});
      }
    }

    it('should merge global responses with explicit ones', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        'path',
        '',
        {
          '500': { description: '500 - global error response' },
          '502': { description: '502 - global error response' },
          '504': { description: '504 - global error response' }
        }
      );

      // GET
      expect(
        (routes[0].responses['200'] as ResponseObject).description
      ).toEqual('200 - method response');
      expect(
        (routes[0].responses['500'] as ResponseObject).description
      ).toEqual('500 - method error response');
      expect(
        (routes[0].responses['502'] as ResponseObject).description
      ).toEqual('502 - controller error response');
      expect(
        (routes[0].responses['504'] as ResponseObject).description
      ).toEqual('504 - global error response');
    });
  });
});

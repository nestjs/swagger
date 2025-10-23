import {
  All,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Version,
  VersioningType
} from '@nestjs/common';
import { VERSION_NEUTRAL, VersionValue } from '@nestjs/common/interfaces';
import { ApplicationConfig } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { upperFirst } from 'lodash';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiDefaultGetter,
  ApiDefaultResponse,
  ApiExcludeController,
  ApiExtraModels,
  ApiHeader,
  ApiLink,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiResponse,
  ApiSchema
} from '../../lib/decorators';
import { DenormalizedDoc } from '../../lib/interfaces/denormalized-doc.interface';
import { ResponseObject } from '../../lib/interfaces/open-api-spec.interface';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { SchemaObjectFactory } from '../../lib/services/schema-object-factory';
import { SwaggerTypesMapper } from '../../lib/services/swagger-types-mapper';
import { GlobalParametersStorage } from '../../lib/storages/global-parameters.storage';
import { GlobalResponsesStorage } from '../../lib/storages/global-responses.storage';
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
  const controllerKeyMethodKeyVersionKeyOperationIdFactory = (
    controllerKey: string,
    methodKey: string,
    versionKey?: string
  ) =>
    versionKey
      ? `${controllerKey}.${methodKey}.${versionKey}`
      : `${controllerKey}.${methodKey}`;

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
        enumName: 'LettersEnum',
        enumSchema: {
          description: 'This is a description for the LettersEnum schema',
          deprecated: true
        },
        description: "This is a description for 'enum' property",
        deprecated: false,
        default: LettersEnum.B
      })
      enum: LettersEnum;

      @ApiProperty({
        enum: LettersEnum,
        enumName: 'LettersEnum',
        description: "This is a description for 'enumArr' property",
        deprecated: false,
        default: [LettersEnum.A],
        isArray: true
      })
      enumArr: LettersEnum[];

      @ApiProperty({
        enum: () => LettersEnum,
        enumName: 'LettersEnum'
      })
      enumFunction: LettersEnum;

      @ApiProperty({ type: [String], format: 'uuid' })
      formatArray: string[];
    }

    class ErrorEntitiesDto {
      @ApiProperty()
      isError: boolean;

      @ApiProperty()
      reason: string;
    }

    @Controller('')
    class FooController {
      @Post('foos')
      @ApiOperation({ summary: 'Create foo' })
      @ApiCreatedResponse({
        type: Foo,
        description: 'Newly created Foo object',
        example: {
          id: 'foo',
          name: 'Foo'
        }
      })
      @ApiBadRequestResponse({
        type: Foo,
        description: 'Invalid parameter error',
        examples: {
          ParameterInvalidName: {
            summary: 'failure create foo object (invalid name)',
            value: {
              isError: true,
              reason: 'Foo parameter name is invalid'
            }
          },
          ParameterInvalidEmail: {
            summary: 'failure create foo object (invalid email)',
            value: {
              isError: true,
              reason: 'Foo parameter email is invalid'
            }
          }
        }
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

    it('sees two examples for error responses by same response code', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(
        (routes[0].responses['400'] as ResponseObject).content[
          'application/json'
        ].examples.ParameterInvalidName
      ).toBeDefined();
      expect(
        (routes[0].responses['400'] as ResponseObject).content[
          'application/json'
        ].examples.ParameterInvalidEmail
      ).toBeDefined();
    });

    it('sees two controller operations and their responses', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );
      const operationPrefix = 'FooController_';

      validateRoutes(routes, operationPrefix);
    });

    @Controller('')
    class FooWithMetadataController {
      @Post('foos')
      @ApiCreatedResponse({
        type: Foo,
        description: 'Newly created Foo object',
        example: {
          id: 'foo',
          name: 'Foo'
        }
      })
      create(
        @Body() createFoo: CreateFoo,
        @Query() listEntities: ListEntitiesDto
      ): Promise<Foo> {
        return Promise.resolve({});
      }

      @Get(['foos/:objectId', 'foo/:objectId'])
      find(
        @Param('objectId') objectId: string,
        @Query('page') q: string
      ): Promise<Foo[]> {
        return Promise.resolve([]);
      }

      static [METADATA_FACTORY_NAME]() {
        return {
          create: {
            summary: 'Create foo',
            example: {
              id: 'foo',
              name: 'Foo'
            }
          },
          find: {
            summary: 'List all Foos',
            type: [Foo]
          }
        };
      }
    }

    it('sees two controller operations and their responses (metadata cache)', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooWithMetadataController(),
          metatype: FooWithMetadataController
        } as unknown as InstanceWrapper<FooWithMetadataController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );
      const operationPrefix = 'FooWithMetadataController_';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix',
          operationIdFactory: methodKeyOperationIdFactory
        }
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
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix',
          operationIdFactory: controllerKeyMethodKeyOperationIdFactory
        }
      );
      const operationPrefix = 'FooController.';

      validateRoutes(routes, operationPrefix);
    });

    const validateRoutes = (
      routes: DenormalizedDoc[],
      operationPrefix: string
    ) => {
      expect(routes.length).toEqual(3);

      // POST
      expect(routes[0].root.operationId).toEqual(operationPrefix + 'create');
      expect(routes[0].root.method).toEqual('post');
      expect(routes[0].root.path).toEqual('/globalPrefix/modulePath/foos');
      expect(routes[0].root.summary).toEqual('Create foo');
      expect(routes[0].root.parameters.length).toEqual(7);
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
          deprecated: false,
          description: "This is a description for 'enum' property",
          schema: {
            $ref: '#/components/schemas/LettersEnum'
          }
        },
        {
          in: 'query',
          name: 'enumArr',
          required: true,
          deprecated: false,
          description: "This is a description for 'enumArr' property",
          schema: {
            items: {
              $ref: '#/components/schemas/LettersEnum'
            },
            type: 'array'
          }
        },
        {
          in: 'query',
          name: 'enumFunction',
          required: true,
          schema: {
            $ref: '#/components/schemas/LettersEnum'
          }
        },
        {
          in: 'query',
          name: 'formatArray',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid'
            }
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

      const createdResponse = routes[0].responses['201'] as ResponseObject;
      expect(createdResponse.description).toEqual('Newly created Foo object');
      expect(createdResponse.content['application/json']).toEqual({
        schema: {
          $ref: '#/components/schemas/Foo'
        },
        example: { id: 'foo', name: 'Foo' }
      });
      expect(createdResponse).not.toHaveProperty('example');
      expect(createdResponse).not.toHaveProperty('examples');

      // GET
      expect(routes[1].root.operationId).toEqual(operationPrefix + 'find[0]');
      expect(routes[1].root.method).toEqual('get');
      expect(routes[1].root.path).toEqual(
        '/globalPrefix/modulePath/foos/{objectId}'
      );
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

      // GET alias
      expect(routes[2].root.operationId).toEqual(operationPrefix + 'find[1]');
      expect(routes[2].root.method).toEqual('get');
      expect(routes[2].root.path).toEqual(
        '/globalPrefix/modulePath/foo/{objectId}'
      );
      expect(routes[2].root.summary).toEqual('List all Foos');
      expect(routes[2].root.parameters.length).toEqual(2);
      expect(routes[2].root.parameters).toEqual([
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
        (routes[2].responses['200'] as ResponseObject).description
      ).toEqual('');
      expect(
        (routes[2].responses['200'] as ResponseObject).content[
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
      @ApiParam({ name: 'objectId', type: 'string', format: 'uuid' })
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
        new ApplicationConfig(),
        { modulePath: undefined, globalPrefix: 'globalPrefix' }
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
        new ApplicationConfig(),
        {
          modulePath: undefined,
          globalPrefix: 'globalPrefix',
          operationIdFactory: methodKeyOperationIdFactory
        }
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
        new ApplicationConfig(),
        {
          modulePath: undefined,
          globalPrefix: 'globalPrefix',
          operationIdFactory: controllerKeyMethodKeyOperationIdFactory
        }
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
      expect(routes[0].root.path).toEqual('/globalPrefix/foos');
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
      expect(routes[1].root.path).toEqual('/globalPrefix/foos/{objectId}');
      expect(routes[1].root.summary).toEqual('List all Foos');
      expect(routes[1].root.parameters.length).toEqual(2);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
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

    class ErrorEntitiesDto {
      @ApiProperty()
      isError: boolean;

      @ApiProperty()
      reason: string;
    }

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
      @ApiBadRequestResponse({
        type: Foo,
        description: 'Invalid parameter error',
        examples: {
          ParameterInvalidName: {
            summary: 'failure create foo object (invalid name)',
            value: {
              isError: true,
              reason: 'Foo parameter name is invalid'
            }
          },
          ParameterInvalidEmail: {
            summary: 'failure create foo object (invalid email)',
            value: {
              isError: true,
              reason: 'Foo parameter email is invalid'
            }
          }
        }
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
        new ApplicationConfig(),
        {
          modulePath: 'modulePath'
        }
      );
      const operationPrefix = 'FooController_';

      validateRoutes(routes, operationPrefix);
    });

    it('sees two examples for error responses for the same response code', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      const badRequestResponse = routes[0].responses['400'] as ResponseObject;
      expect(
        badRequestResponse.content['application/xml'].examples
          .ParameterInvalidName
      ).toBeDefined();
      expect(
        badRequestResponse.content['application/xml'].examples
          .ParameterInvalidEmail
      ).toBeDefined();
      expect(badRequestResponse).not.toHaveProperty('example');
      expect(badRequestResponse).not.toHaveProperty('examples');
    });

    it('sees two controller operations and their responses with custom operationIdFactory to return methodKey', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          operationIdFactory: methodKeyOperationIdFactory
        }
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
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          operationIdFactory: controllerKeyMethodKeyOperationIdFactory
        }
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
      expect(routes[0].root.path).toEqual('/modulePath/foos');
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
      expect(routes[1].root.path).toEqual('/modulePath/foos/{objectId}');
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

      @Version('2')
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
      const config = new ApplicationConfig();
      config.enableVersioning({
        type: VersioningType.URI
      });
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        config,
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      validateRoutes(routes);
    });

    it('should merge implicit metadata with explicit options and use default operationIdFactory', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const config = new ApplicationConfig();
      config.enableVersioning({
        type: VersioningType.URI
      });
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        config,
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
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
      expect(routes[1].root.path).toEqual(
        '/globalPrefix/v2/modulePath/foos/{objectId}'
      );
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
      D = 1,
      E,
      F = (() => 3)()
    }

    class Foo {}

    @Controller({ path: '', version: '3' })
    class FooController {
      @Get('foos/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum
      })
      @ApiQuery({ name: 'order', enum: QueryEnum })
      @ApiQuery({ name: 'page', enum: ['d', 'e', 'f'], isArray: true })
      find(@Param('objectId') objectId: ParamEnum): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    @Controller('')
    class Foo2Controller {
      @Get('foos/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: ParamEnum
      })
      @ApiQuery({ name: 'order', enum: QueryEnum })
      @ApiQuery({ name: 'page', enum: ['d', 'e', 'f'] })
      find(
        @Param('objectId') objectId: ParamEnum,
        @Query('order') order: QueryEnum,
        @Query('page') page: 'd' | 'e' | 'f'
      ): Promise<Foo[]> {
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
      findBar(
        @Param('objectId') objectId: ParamEnum,
        @Query('order') order: QueryEnum,
        @Query('page') page: QueryEnum[]
      ): Promise<Foo> {
        return Promise.resolve(null);
      }
    }

    @Controller('')
    class Bar2Controller {
      @Get('bars/:objectId')
      @ApiParam({
        name: 'objectId',
        enum: [1, 2, 3],
        enumName: 'NumberEnum'
      })
      findBar(@Param('objectId') objectId: number): Promise<Foo> {
        return Promise.resolve(null);
      }
    }

    it('should properly define enums', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const config = new ApplicationConfig();
      config.enableVersioning({
        type: VersioningType.URI
      });
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        config,
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(routes[0].root.path).toEqual(
        '/globalPrefix/v3/modulePath/foos/{objectId}'
      );
      expect(routes[0].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string',
            enum: ['a', 'b', 'c']
          }
        },
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            items: {
              type: 'string',
              enum: ['d', 'e', 'f']
            },
            type: 'array'
          }
        },
        {
          in: 'query',
          name: 'order',
          required: true,
          schema: {
            type: 'number',
            enum: [1, 2, 3]
          }
        }
      ]);
    });

    it('should properly define enum and not add isArray prop to params', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new Foo2Controller(),
          metatype: Foo2Controller
        } as InstanceWrapper<Foo2Controller>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string',
            enum: ['a', 'b', 'c']
          }
        },
        {
          in: 'query',
          name: 'order',
          required: true,
          schema: {
            type: 'number',
            enum: [1, 2, 3]
          }
        },
        {
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'string',
            enum: ['d', 'e', 'f']
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
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            $ref: '#/components/schemas/ParamEnum'
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
          in: 'query',
          name: 'page',
          required: true,
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/QueryEnum'
            }
          }
        }
      ]);
    });

    it('should properly define number enum as schema', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);

      const schema = explorer.getSchemas();
      const routes = explorer.exploreController(
        {
          instance: new Bar2Controller(),
          metatype: Bar2Controller
        } as InstanceWrapper<Bar2Controller>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(schema.NumberEnum).toEqual({ type: 'number', enum: [1, 2, 3] });
      expect(routes[0].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            $ref: '#/components/schemas/NumberEnum'
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

      @ApiHeader({
        name: 'X-API-Version',
        description: 'API version',
        example: '2025-05-16'
      })
      @Get('foos')
      find2(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    it('should properly define headers', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
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
      expect(routes[2].root.parameters).toEqual([
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
          description: 'API version',
          name: 'X-API-Version',
          in: 'header',
          schema: {
            type: 'string',
            example: '2025-05-16'
          }
        }
      ]);
    });
  });

  describe('should include extra models', () => {
    class ExtraModel {
      @ApiProperty()
      p1: string;
    }

    class ExtraModel2 {
      @ApiProperty()
      p2: string;
    }

    it('when multiple decorators is used on controller', () => {
      @Controller()
      @ApiExtraModels(ExtraModel)
      @ApiExtraModels(ExtraModel2)
      class FooController {
        @Get()
        find() {
          return true;
        }
      }

      const explorer = new SwaggerExplorer(schemaObjectFactory);
      explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      const schemas = explorer.getSchemas();

      expect(schemas.ExtraModel2).toBeDefined();
      expect(schemas.ExtraModel).toBeDefined();
    });

    it('when multiple decorators is used on controller`s method', () => {
      @Controller()
      class FooController {
        @Get()
        @ApiExtraModels(ExtraModel)
        @ApiExtraModels(ExtraModel2)
        find() {
          return true;
        }
      }

      const explorer = new SwaggerExplorer(schemaObjectFactory);
      explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      const schemas = explorer.getSchemas();

      expect(schemas.ExtraModel2).toBeDefined();
      expect(schemas.ExtraModel).toBeDefined();
    });
  });
  describe('when a controller is excluded', () => {
    class Foo {}

    @ApiExcludeController()
    @Controller('')
    class FooController {
      @Get('foos/:objectId')
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }

      @Post('foos')
      create(): Promise<any> {
        return Promise.resolve();
      }
    }

    it('should correctly define controller exclusion', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect(routes).toHaveLength(0);
    });
  });

  describe('when defaultVersion is defined', () => {
    let explorer: SwaggerExplorer;
    let config: ApplicationConfig;

    describe('and controller/route versions are defined', () => {
      const CONTROLLER_VERSION: VersionValue = '1';
      const METHOD_VERSION: VersionValue = '2';
      const CONTROLLER_MULTIPLE_VERSIONS: VersionValue = ['3', '4'];
      const CONTROLLER_MULTIPLE_VERSIONS_NEUTRAL: VersionValue = [
        '5',
        VERSION_NEUTRAL
      ];

      @Controller({ path: 'with-version', version: CONTROLLER_VERSION })
      class WithVersionController {
        @Get()
        foo(): void {}

        @Version(METHOD_VERSION)
        @Get()
        bar(): void {}
      }

      @Controller({
        path: 'with-multiple-version',
        version: CONTROLLER_MULTIPLE_VERSIONS
      })
      class WithMultipleVersionsController {
        @Get()
        foo(): void {}
      }

      @Controller({
        path: 'with-multiple-version-neutral',
        version: CONTROLLER_MULTIPLE_VERSIONS_NEUTRAL
      })
      class WithMultipleVersionsNeutralController {
        @Get()
        foo(): void {}
      }

      beforeAll(() => {
        explorer = new SwaggerExplorer(schemaObjectFactory);

        config = new ApplicationConfig();
        config.enableVersioning({
          type: VersioningType.URI,
          defaultVersion: 'THIS_SHOULD_NOT_APPEAR_ANYWHERE'
        });
      });

      describe('and using the default operationIdFactory', () => {
        it('should use controller version defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithVersionController(),
              metatype: WithVersionController
            } as InstanceWrapper<WithVersionController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix'
            }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${CONTROLLER_VERSION}/modulePath/with-version`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithVersionController_foo_v1`
          );
        });

        it('should use route version defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithVersionController(),
              metatype: WithVersionController
            } as InstanceWrapper<WithVersionController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix'
            }
          );

          expect(routes[1].root.path).toEqual(
            `/globalPrefix/v${METHOD_VERSION}/modulePath/with-version`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithVersionController_bar_v2`
          );
        });

        it('should use multiple versions defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithMultipleVersionsController(),
              metatype: WithMultipleVersionsController
            } as InstanceWrapper<WithMultipleVersionsController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix'
            }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS[0] as string
            }/modulePath/with-multiple-version`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithMultipleVersionsController_foo_v3`
          );
          expect(routes[1].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS[1] as string
            }/modulePath/with-multiple-version`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithMultipleVersionsController_foo_v4`
          );
        });

        it('should use multiple versions with neutral defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithMultipleVersionsNeutralController(),
              metatype: WithMultipleVersionsNeutralController
            } as InstanceWrapper<WithMultipleVersionsNeutralController>,
            config,
            { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS_NEUTRAL[0] as string
            }/modulePath/with-multiple-version-neutral`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithMultipleVersionsNeutralController_foo[0]_v5`
          );

          expect(routes[1].root.path).toEqual(
            `/globalPrefix/modulePath/with-multiple-version-neutral`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithMultipleVersionsNeutralController_foo[1]`
          );
        });
      });

      describe('and has an operationIdFactory that uses the method version', () => {
        it('should use controller version defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithVersionController(),
              metatype: WithVersionController
            } as InstanceWrapper<WithVersionController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix',
              operationIdFactory:
                controllerKeyMethodKeyVersionKeyOperationIdFactory
            }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${CONTROLLER_VERSION}/modulePath/with-version`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithVersionController.foo.v${CONTROLLER_VERSION}`
          );
        });

        it('should use route version defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithVersionController(),
              metatype: WithVersionController
            } as InstanceWrapper<WithVersionController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix',
              operationIdFactory:
                controllerKeyMethodKeyVersionKeyOperationIdFactory
            }
          );

          expect(routes[1].root.path).toEqual(
            `/globalPrefix/v${METHOD_VERSION}/modulePath/with-version`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithVersionController.bar.v${METHOD_VERSION}`
          );
        });

        it('should use multiple versions defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithMultipleVersionsController(),
              metatype: WithMultipleVersionsController
            } as InstanceWrapper<WithMultipleVersionsController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix',
              operationIdFactory:
                controllerKeyMethodKeyVersionKeyOperationIdFactory
            }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS[0] as string
            }/modulePath/with-multiple-version`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithMultipleVersionsController.foo.v${
              CONTROLLER_MULTIPLE_VERSIONS[0] as string
            }`
          );
          expect(routes[1].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS[1] as string
            }/modulePath/with-multiple-version`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithMultipleVersionsController.foo.v${
              CONTROLLER_MULTIPLE_VERSIONS[1] as string
            }`
          );
        });

        it('should use multiple versions with neutral defined', () => {
          const routes = explorer.exploreController(
            {
              instance: new WithMultipleVersionsNeutralController(),
              metatype: WithMultipleVersionsNeutralController
            } as InstanceWrapper<WithMultipleVersionsNeutralController>,
            config,
            {
              modulePath: 'modulePath',
              globalPrefix: 'globalPrefix',
              operationIdFactory:
                controllerKeyMethodKeyVersionKeyOperationIdFactory
            }
          );

          expect(routes[0].root.path).toEqual(
            `/globalPrefix/v${
              CONTROLLER_MULTIPLE_VERSIONS_NEUTRAL[0] as string
            }/modulePath/with-multiple-version-neutral`
          );
          expect(routes[0].root.operationId).toEqual(
            `WithMultipleVersionsNeutralController.foo[0].v${
              CONTROLLER_MULTIPLE_VERSIONS_NEUTRAL[0] as string
            }`
          );
          expect(routes[1].root.path).toEqual(
            `/globalPrefix/modulePath/with-multiple-version-neutral`
          );
          expect(routes[1].root.operationId).toEqual(
            `WithMultipleVersionsNeutralController.foo[1]`
          );
        });
      });

      it('should use controller version defined', () => {
        const routes = explorer.exploreController(
          {
            instance: new WithVersionController(),
            metatype: WithVersionController
          } as InstanceWrapper<WithVersionController>,
          config,
          { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
        );

        expect(routes[0].root.path).toEqual(
          `/globalPrefix/v${CONTROLLER_VERSION}/modulePath/with-version`
        );
      });

      it('should use route version defined', () => {
        const routes = explorer.exploreController(
          {
            instance: new WithVersionController(),
            metatype: WithVersionController
          } as InstanceWrapper<WithVersionController>,
          config,
          {
            modulePath: 'modulePath',
            globalPrefix: 'globalPrefix'
          }
        );

        expect(routes[1].root.path).toEqual(
          `/globalPrefix/v${METHOD_VERSION}/modulePath/with-version`
        );
      });

      it('should use multiple versions defined', () => {
        const routes = explorer.exploreController(
          {
            instance: new WithMultipleVersionsController(),
            metatype: WithMultipleVersionsController
          } as InstanceWrapper<WithMultipleVersionsController>,
          config,
          { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
        );

        expect(routes[0].root.path).toEqual(
          `/globalPrefix/v${
            CONTROLLER_MULTIPLE_VERSIONS[0] as string
          }/modulePath/with-multiple-version`
        );
        expect(routes[1].root.path).toEqual(
          `/globalPrefix/v${
            CONTROLLER_MULTIPLE_VERSIONS[1] as string
          }/modulePath/with-multiple-version`
        );
      });
    });

    describe('and controller/route versions are not defined', () => {
      const DEFAULT_VERSION: VersionValue = '1';

      @Controller('with-multiple-version')
      class WithoutVersionsController {
        @Get()
        foo(): void {}
      }

      it('should use the global default version ', () => {
        const explorer = new SwaggerExplorer(schemaObjectFactory);
        const config = new ApplicationConfig();
        config.enableVersioning({
          type: VersioningType.URI,
          defaultVersion: DEFAULT_VERSION
        });
        const routes = explorer.exploreController(
          {
            instance: new WithoutVersionsController(),
            metatype: WithoutVersionsController
          } as InstanceWrapper<WithoutVersionsController>,
          config,
          { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
        );

        expect(routes[0].root.path).toEqual(
          `/globalPrefix/v${DEFAULT_VERSION}/modulePath/with-multiple-version`
        );
      });
    });
  });

  describe('when multiple versions are defined', () => {
    let explorer: SwaggerExplorer;
    let config: ApplicationConfig;

    describe('and controller versions are defined', () => {
      const CONTROLLER_MULTIPLE_VERSIONS: VersionValue = ['2', VERSION_NEUTRAL];

      class BarBodyDto {
        name: string;
      }
      @Controller({
        path: 'with-multiple-version',
        version: CONTROLLER_MULTIPLE_VERSIONS
      })
      class WithMultipleVersionsController {
        @Get()
        foo(): void {}

        @Post()
        bar(@Body() body: BarBodyDto): BarBodyDto {
          return body;
        }
      }

      beforeAll(() => {
        explorer = new SwaggerExplorer(schemaObjectFactory);

        config = new ApplicationConfig();
        config.enableVersioning({
          type: VersioningType.URI,
          defaultVersion: VERSION_NEUTRAL
        });
      });

      it('should use multiple versions', () => {
        const routes = explorer.exploreController(
          {
            instance: new WithMultipleVersionsController(),
            metatype: WithMultipleVersionsController
          } as InstanceWrapper<WithMultipleVersionsController>,
          config,
          { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
        );

        expect(routes[0].root.path).toEqual(
          `/globalPrefix/v${
            CONTROLLER_MULTIPLE_VERSIONS[0] as string
          }/modulePath/with-multiple-version`
        );
        expect(routes[1].root.path).toEqual(
          `/globalPrefix/modulePath/with-multiple-version`
        );
      });

      it('should have the requestBody in each version of POST route', () => {
        const routes = explorer.exploreController(
          {
            instance: new WithMultipleVersionsController(),
            metatype: WithMultipleVersionsController
          } as InstanceWrapper<WithMultipleVersionsController>,
          config,
          { modulePath: 'modulePath', globalPrefix: 'globalPrefix' }
        );
        const postRoutes = routes.filter(
          (route) => route.root?.method === 'post'
        );

        expect(postRoutes[0].root.requestBody).toBeDefined();
        expect(postRoutes[1].root.requestBody).toBeDefined();
      });
    });
  });

  describe('when @All(...) is used', () => {
    @Controller('')
    class AllController {
      @All('*')
      all(): Promise<void> {
        return Promise.resolve();
      }
    }

    it('should create route for every method', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new AllController(),
          metatype: AllController
        } as InstanceWrapper<AllController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(routes.length).toEqual(8);
      expect(
        [
          'get',
          'post',
          'put',
          'delete',
          'patch',
          'options',
          'head',
          'search'
        ].every((method) =>
          routes.find((route) => route.root.method === method)
        )
      ).toBe(true);
      expect(routes.find((route) => route.root.method === 'all')).toBe(
        undefined
      );
      // check if all routes are equal except for method
      expect(
        routes.filter(
          (v, i, a) =>
            a.findIndex((v2) =>
              ['path', 'parameter'].every((k) => v2[k] === v[k])
            ) === i
        ).length
      ).toEqual(1);
    });
  });

  describe('when custom schema names are used', () => {
    @ApiSchema({
      name: 'Foo'
    })
    class FooDto {}

    @ApiSchema({
      name: 'CreateFoo'
    })
    class CreateFooDto {}

    @Controller('')
    class FooController {
      @Post('foos')
      @ApiBody({ type: CreateFooDto })
      @ApiOperation({ summary: 'Create foo' })
      @ApiCreatedResponse({
        type: FooDto,
        description: 'Newly created Foo object'
      })
      create(@Body() createFoo: CreateFooDto): Promise<FooDto> {
        return Promise.resolve({});
      }

      @Get('foos/:objectId')
      @ApiParam({ name: 'objectId', type: 'string' })
      @ApiQuery({ name: 'page', type: 'string' })
      @ApiOperation({ summary: 'List all Foos' })
      @ApiOkResponse({ type: [FooDto] })
      @ApiDefaultResponse({ type: [FooDto] })
      find(
        @Param('objectId') objectId: string,
        @Query('page') q: string
      ): Promise<FooDto[]> {
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
        new ApplicationConfig(),
        { modulePath: 'path' }
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

  describe('when global parameters are defined', () => {
    class Foo {}

    @Controller('')
    class FooController {
      @Get('foos')
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }
    }

    it('should properly define global parameters', () => {
      GlobalParametersStorage.add(
        {
          name: 'x-tenant-id',
          in: 'header',
          schema: { type: 'string' }
        },
        {
          name: 'x-tenant-id-2',
          in: 'header',
          schema: { type: 'string' }
        }
      );
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath',
          globalPrefix: 'globalPrefix'
        }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          name: 'x-tenant-id',
          in: 'header',
          schema: { type: 'string' }
        },
        {
          name: 'x-tenant-id-2',
          in: 'header',
          schema: { type: 'string' }
        }
      ]);
      GlobalParametersStorage.clear();
    });
  });

  describe('when links are defined', () => {
    class Human {
      @ApiProperty()
      id: string;

      @ApiProperty({
        link: () => Human,
        example: ['a33d0f4b-aec2-4b07-b407-45d8e70332b2']
      })
      @ApiPropertyOptional()
      spouseId?: string;

      @ApiProperty({
        link: () => Human,
        example: [
          '5593519b-b830-4c5a-b5f6-3cbbfbecbd1b',
          '8044bf32-5485-42c4-b481-d6ef1ae89163'
        ]
      })
      parentIds: string[];
    }

    @Controller('')
    class HumanController {
      @ApiDefaultGetter(Human, 'id')
      @Get(':id')
      @ApiOkResponse({
        type: Human,
        description: 'Human corresponding to `id`'
      })
      getHuman(@Param('id') id: string): Promise<Human> {
        const human = new Human();
        human.id = id;
        return Promise.resolve(human);
      }

      @Get(':id/children')
      @ApiLink({ from: Human, routeParam: 'id' })
      @ApiOkResponse({
        type: [Human],
        description: 'Children of human with id `id`'
      })
      getChildren(@Param('id') id: string): Promise<Human[]> {
        return Promise.resolve([]);
      }
    }

    it('should generate open api link objects', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);

      const routes = explorer.exploreController(
        {
          instance: new HumanController(),
          metatype: HumanController
        } as InstanceWrapper<HumanController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect((routes[0].responses['200'] as ResponseObject).links).toEqual({
        HumanController_getHuman_from_spouseId: {
          operationId: 'HumanController_getHuman',
          parameters: {
            id: '$response.body#/spouseId'
          }
        },
        HumanController_getHuman_from_parentIds: {
          operationId: 'HumanController_getHuman',
          parameters: {
            id: '$response.body#/parentIds'
          }
        },
        HumanController_getChildren_from_id: {
          operationId: 'HumanController_getChildren',
          parameters: {
            id: '$response.body#/id'
          }
        }
      });

      expect((routes[1].responses['200'] as ResponseObject).links).toEqual(
        (routes[0].responses['200'] as ResponseObject).links
      );
    });

    it('should generate open api link objects with custom linkNameFactory', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);

      const routes = explorer.exploreController(
        {
          instance: new HumanController(),
          metatype: HumanController
        } as InstanceWrapper<HumanController>,
        new ApplicationConfig(),
        {
          modulePath: 'path',
          linkNameFactory: (controllerKey, methodKey, paramKey) =>
            paramKey === 'id'
              ? methodKey.replace(/^get/, '')
              : upperFirst(paramKey.replace(/Id(s)?$/, '$1'))
        }
      );

      expect((routes[0].responses['200'] as ResponseObject).links).toEqual({
        Spouse: {
          operationId: 'HumanController_getHuman',
          parameters: {
            id: '$response.body#/spouseId'
          }
        },
        Parents: {
          operationId: 'HumanController_getHuman',
          parameters: {
            id: '$response.body#/parentIds'
          }
        },
        Children: {
          operationId: 'HumanController_getChildren',
          parameters: {
            id: '$response.body#/id'
          }
        }
      });
    });
  });

  describe('when params are defined', () => {
    class Foo {}

    @ApiParam({ name: 'parentId', type: 'number' })
    @Controller(':parentId')
    class FooController {
      @ApiParam({ name: 'objectId', type: 'number' })
      @Get('foos/:objectId')
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }

      @Post('foos')
      create(): Promise<any> {
        return Promise.resolve();
      }
    }

    it('should properly define params', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'number'
          }
        },
        {
          in: 'path',
          name: 'parentId',
          required: true,
          schema: {
            type: 'number'
          }
        }
      ]);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'path',
          name: 'parentId',
          required: true,
          schema: {
            type: 'number'
          }
        }
      ]);
    });
  });

  describe('when queries are defined', () => {
    class Foo {}

    @ApiQuery({ name: 'parentId', type: 'number' })
    @Controller('')
    class FooController {
      @ApiQuery({ name: 'objectId', type: 'number' })
      @Get('foos')
      find(): Promise<Foo[]> {
        return Promise.resolve([]);
      }

      @Post('foos')
      create(): Promise<any> {
        return Promise.resolve();
      }
    }

    it('should properly define params', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          in: 'query',
          name: 'objectId',
          required: true,
          schema: {
            type: 'number'
          }
        },
        {
          in: 'query',
          name: 'parentId',
          required: true,
          schema: {
            type: 'number'
          }
        }
      ]);
      expect(routes[1].root.parameters).toEqual([
        {
          in: 'query',
          name: 'parentId',
          required: true,
          schema: {
            type: 'number'
          }
        }
      ]);
    });
  });

  describe('when arrays are used', () => {
    enum LettersEnum {
      A = 'A',
      B = 'B',
      C = 'C'
    }

    class NestedDto {
      @ApiProperty()
      nestedString: string;
    }

    class ObjectDto {
      @ApiProperty()
      field: string;

      @ApiProperty()
      nestedObject: NestedDto;

      @ApiProperty({
        isArray: true,
        type: NestedDto
      })
      nestedArrayOfObjects: NestedDto[];

      @ApiProperty({
        type: [NestedDto]
      })
      nestedArrayOfObjects2: NestedDto[];
    }

    class FooDto {
      @ApiProperty({
        isArray: true,
        type: ObjectDto
      })
      arrayOfObjectsDto: ObjectDto[];
    }

    class FooController {
      @Get('/route1')
      route1(@Query() fooDto: FooDto) {}
      @Get('/route2')
      route2(@Query() objectDto: ObjectDto) {}
    }

    it('should properly define arrays in query', () => {
      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        { modulePath: 'path' }
      );

      expect(routes[0].root.parameters).toEqual([
        {
          name: 'arrayOfObjectsDto',
          required: true,
          in: 'query',
          schema: {
            items: {
              $ref: '#/components/schemas/ObjectDto'
            },
            type: 'array'
          }
        }
      ]);
      expect(routes[1].root.parameters).toEqual([
        {
          name: 'field',
          required: true,
          in: 'query',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'nestedObject',
          required: true,
          in: 'query',
          schema: {
            $ref: '#/components/schemas/NestedDto'
          }
        },
        {
          name: 'nestedArrayOfObjects',
          required: true,
          in: 'query',
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/NestedDto'
            }
          }
        },
        {
          name: 'nestedArrayOfObjects2',
          required: true,
          in: 'query',
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/NestedDto'
            }
          }
        }
      ]);
    });
  });

  describe('when global responses defined', () => {
    @Controller('')
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
      get(): Promise<any> {
        return Promise.resolve({});
      }
    }

    it('should merge global responses with explicit ones', () => {
      GlobalResponsesStorage.add({
        401: { description: '401 - global error response' },
        403: { description: '403 - global error response' },
        500: { description: '500 - global internal server error' }
      });

      const explorer = new SwaggerExplorer(schemaObjectFactory);
      const routes = explorer.exploreController(
        {
          instance: new FooController(),
          metatype: FooController
        } as InstanceWrapper<FooController>,
        new ApplicationConfig(),
        {
          modulePath: 'modulePath'
        }
      );

      expect(
        (routes[0].responses['401'] as ResponseObject).description
      ).toEqual('401 - global error response');
      expect(
        (routes[0].responses['500'] as ResponseObject).description
      ).toEqual('500 - global internal server error');
      expect(
        (routes[0].responses['502'] as ResponseObject).description
      ).toEqual('502 - controller error response');
      expect(
        (routes[0].responses['200'] as ResponseObject).description
      ).toEqual('200 - method response');
      expect(
        (routes[0].responses['403'] as ResponseObject).description
      ).toEqual('403 - global error response');

      GlobalParametersStorage.clear();
    });
  });
});

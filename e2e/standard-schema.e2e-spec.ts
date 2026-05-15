import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication
} from '@nestjs/platform-express';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import type { BaseIssue, BaseSchema } from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import type { ZodType } from 'zod';
import { createSchema } from 'zod-openapi';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerModule
} from '../lib/index.js';
import {
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject
} from '../lib/interfaces/open-api-spec.interface.js';
import { ApplicationModule } from './src/app.module.js';
import { ExpressController } from './src/express.controller.js';
import { FastifyController } from './src/fastify.controller.js';

describe.each([
  {
    label: 'Express',
    createApp: async () =>
      NestFactory.create<NestExpressApplication>(
        {
          module: class {},
          imports: [ApplicationModule],
          controllers: [ExpressController]
        },
        new ExpressAdapter(),
        { logger: false }
      )
  },
  {
    label: 'Fastify',
    createApp: async () =>
      NestFactory.create<NestFastifyApplication>(
        {
          module: class {},
          imports: [ApplicationModule],
          controllers: [FastifyController]
        },
        new FastifyAdapter(),
        { logger: false }
      )
  }
])('$label standard schema support', ({ createApp }) => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should generate standard schema overrides for body, query, param, unions, enums, and nested metadata', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Cats example')
        .setDescription('The cats API description')
        .setVersion('1.0')
        .addTag('cats')
        .build(),
      createTestStandardSchemaOptions()
    );

    assertStandardSchemaDocument(document);
  });
});

function createTestStandardSchemaOptions(): SwaggerDocumentOptions {
  return {
    standardSchemaConverter: (schema, { schemaType }) => {
      if (isZodStandardSchema(schema)) {
        const converted = createSchema(schema, {
          io: schemaType,
          openapiVersion: '3.0.0'
        });
        return {
          schema: converted.schema as SchemaObject | ReferenceObject,
          components:
            converted.components as unknown as Record<string, SchemaObject>
        };
      }

      if (isValibotStandardSchema(schema)) {
        return {
          schema: toJsonSchema(schema, {
            target: 'openapi-3.0',
            typeMode: schemaType
          }) as unknown as SchemaObject | ReferenceObject
        };
      }

      return undefined;
    }
  };
}

type ValibotSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;

function hasVendor(schema: unknown, vendor: string) {
  return (
    !!schema &&
    typeof schema === 'object' &&
    (schema as { '~standard'?: { vendor?: string } })['~standard']?.vendor ===
      vendor
  );
}

function isZodStandardSchema(schema: unknown): schema is ZodType {
  return hasVendor(schema, 'zod');
}

function isValibotStandardSchema(schema: unknown): schema is ValibotSchema {
  return hasVendor(schema, 'valibot');
}

function getOperation(
  document: OpenAPIObject,
  path: string,
  method: keyof Pick<
    NonNullable<OpenAPIObject['paths'][string]>,
    'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
  >
) {
  const operation = document.paths[path]?.[method];
  expect(operation).toBeDefined();
  if (!operation || '$ref' in operation) {
    throw new Error(`Expected inlined operation for ${method.toUpperCase()} ${path}`);
  }
  return operation as OperationObject;
}

function getRequestBody(operation: OperationObject) {
  const requestBody = operation.requestBody;
  expect(requestBody).toBeDefined();
  if (!requestBody || '$ref' in requestBody) {
    throw new Error('Expected inlined request body');
  }
  return requestBody as RequestBodyObject;
}

function getResponse(operation: OperationObject, status: string) {
  const response = operation.responses[status];
  expect(response).toBeDefined();
  if (!response || '$ref' in response) {
    throw new Error(`Expected inlined response object for status ${status}`);
  }
  return response as ResponseObject;
}

function getSchemaFromRequestBody(requestBody: RequestBodyObject) {
  const schema = requestBody.content?.['application/json']?.schema;
  expect(schema).toBeDefined();
  if (!schema || '$ref' in schema) {
    throw new Error('Expected inlined schema in request body');
  }
  return schema as SchemaObject;
}

function getSchemaFromResponse(response: ResponseObject) {
  const schema = response.content?.['application/json']?.schema;
  expect(schema).toBeDefined();
  if (!schema || '$ref' in schema) {
    throw new Error('Expected inlined schema in response');
  }
  return schema as SchemaObject;
}

function getRequestBodyContent(requestBody: RequestBodyObject) {
  const content = requestBody.content?.['application/json'];
  expect(content).toBeDefined();
  if (!content) {
    throw new Error('Expected application/json request body content');
  }
  return content;
}

function getResponseContent(response: ResponseObject) {
  const content = response.content?.['application/json'];
  expect(content).toBeDefined();
  if (!content) {
    throw new Error('Expected application/json response content');
  }
  return content;
}

function getInlinedSchema(
  schema: SchemaObject | ReferenceObject | undefined,
  message = 'Expected inlined schema'
) {
  expect(schema).toBeDefined();
  if (!schema || '$ref' in schema) {
    throw new Error(message);
  }
  return schema as SchemaObject;
}

function getUnionBranches(schema: SchemaObject) {
  return (schema.anyOf ?? schema.oneOf) as SchemaObject[];
}

function getParameter(
  document: OpenAPIObject,
  path: string,
  method: keyof Pick<
    NonNullable<OpenAPIObject['paths'][string]>,
    'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'
  >,
  name: string
) {
  const operation = getOperation(document, path, method);
  const parameters = operation.parameters as
    | Array<ParameterObject | ReferenceObject>
    | undefined;
  const parameter = parameters?.find(
    (candidate): candidate is ParameterObject =>
      !!candidate && !('$ref' in candidate) && candidate.name === name
  );

  expect(parameter).toBeDefined();
  return parameter as ParameterObject;
}

function assertStandardSchemaDocument(
  document: OpenAPIObject,
  pathPrefix = ''
) {
  const standardBody = getRequestBody(
    getOperation(document, `${pathPrefix}/cats/standard-body`, 'post')
  );
  const standardBodySchema = getSchemaFromRequestBody(standardBody);
  expect(standardBody.required).toBe(true);
  expect(standardBodySchema).toEqual(
    expect.objectContaining({
      properties: expect.objectContaining({
        name: {
          type: 'string',
          minLength: 1,
          description: 'Cat name from Zod',
          example: 'Milo'
        }
      })
    })
  );

  const conflictingBodyRequest = getRequestBody(
    getOperation(document, `${pathPrefix}/cats/standard-body-conflict`, 'post')
  );
  const conflictingBodyContent = getRequestBodyContent(conflictingBodyRequest);
  const conflictingBodySchema = getSchemaFromRequestBody(conflictingBodyRequest);
  expect(conflictingBodyRequest.description).toBe(
    'Explicit body decorator metadata'
  );
  expect(conflictingBodyRequest.required).toBe(false);
  expect(conflictingBodyContent.examples).toEqual({
    legacy: {
      summary: 'Explicit body example',
      value: { legacy: true }
    }
  });
  expect(conflictingBodySchema).toEqual(
    expect.objectContaining({
      type: 'object',
      properties: expect.objectContaining({
        override: {
          type: 'string',
          description: 'Body override from Zod',
          example: 'zod-body'
        },
        count: expect.objectContaining({
          type: 'integer',
          minimum: 1
        })
      })
    })
  );
  expect(conflictingBodySchema.properties).not.toHaveProperty('name');

  const richBodySchema = getSchemaFromRequestBody(
    getRequestBody(
      getOperation(document, `${pathPrefix}/cats/standard-body-rich`, 'post')
    )
  );
  expect(richBodySchema.properties.species).toEqual({
    type: 'string',
    enum: ['cat', 'dog'],
    title: 'Species',
    description: 'Species enum from Zod',
    example: 'cat'
  });
  const richBodyContactSchema = getInlinedSchema(
    richBodySchema.properties.contact,
    'Expected inlined contact schema'
  );
  expect(richBodyContactSchema.title).toBe('PreferredContact');
  expect(richBodyContactSchema.description).toBe(
    'Preferred contact from Zod'
  );
  expect(richBodyContactSchema.examples?.[0] ?? richBodyContactSchema.example).toBe(
    'owner@example.com'
  );
  expect(getUnionBranches(richBodyContactSchema)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'string', format: 'email' }),
      expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          phone: {
            type: 'string',
            description: 'Phone number from Zod',
            example: '123-456'
          }
        })
      })
    ])
  );
  const richBodyProfileSchema = getInlinedSchema(
    richBodySchema.properties.profile,
    'Expected inlined profile schema'
  );
  expect(richBodyProfileSchema.title).toBe('CatProfile');
  expect(richBodyProfileSchema.description).toBe(
    'Nested cat profile from Zod'
  );
  expect(getInlinedSchema(richBodyProfileSchema.properties.nickname)).toEqual({
    type: 'string',
    description: 'Nested nickname from Zod',
    example: 'Captain Whiskers'
  });
  expect(getInlinedSchema(richBodyProfileSchema.properties.temperament)).toEqual({
    type: 'string',
    enum: ['playful', 'calm'],
    description: 'Nested temperament from Zod',
    example: 'playful'
  });
  expect(getInlinedSchema(richBodyProfileSchema.properties.notes)).toEqual(
    expect.objectContaining({
      type: 'string',
      default: 'Indoor only',
      description: 'Nested notes from Zod',
      example: 'Indoor only',
      deprecated: true
    })
  );
  expect(getInlinedSchema(richBodyProfileSchema.properties.traits)).toEqual(
    expect.objectContaining({
      type: 'array',
      description: 'Nested trait list from Zod',
      items: expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          label: {
            type: 'string',
            description: 'Trait label from Zod',
            example: 'affectionate'
          },
          score: expect.objectContaining({
            type: 'number',
            minimum: 0,
            maximum: 10,
            description: 'Trait score from Zod',
            example: 8
          })
        })
      })
    })
  );

  const pageParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query`,
    'get',
    'page'
  );
  expect(pageParam.schema).toEqual({
    type: 'number',
    description: 'Page number from Valibot'
  });
  const searchParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query`,
    'get',
    'search'
  );
  expect(searchParam.schema).toEqual({
    type: 'string',
    title: 'Search term'
  });

  const conflictingFilterParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query-conflict`,
    'get',
    'filter'
  );
  expect(conflictingFilterParam.schema).toEqual(
    expect.objectContaining({
      type: 'integer',
      minimum: 1,
      description: 'Query override from Zod',
      example: 3
    })
  );

  const conflictingActiveParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query-conflict`,
    'get',
    'active'
  );
  expect(conflictingActiveParam.schema).toEqual({
    type: 'boolean',
    description: 'Boolean flag from Zod',
    example: true
  });

  const modeParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query-rich`,
    'get',
    'mode'
  );
  expect(modeParam.schema).toEqual(
    expect.objectContaining({
      type: 'string',
      enum: ['simple', 'advanced'],
      description: 'Mode enum from Valibot'
    })
  );
  const modeParamSchema = getInlinedSchema(modeParam.schema);
  expect(modeParamSchema.examples?.[0] ?? modeParamSchema.example).toBe(
    'simple'
  );

  const filterParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query-rich`,
    'get',
    'filter'
  );
  expect(filterParam.schema).toEqual(
    expect.objectContaining({
      title: 'FilterTitle',
      description: 'Filter union from Valibot'
    })
  );
  const filterParamSchema = getInlinedSchema(filterParam.schema);
  expect(getUnionBranches(filterParamSchema)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'string' }),
      expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          nested: expect.objectContaining({
            type: 'string',
            description: 'Nested filter from Valibot'
          })
        })
      })
    ])
  );
  const nestedFilterSchema = getInlinedSchema(
    getInlinedSchema(
      getUnionBranches(filterParamSchema).find(
        (candidate) => candidate?.type === 'object'
      ),
      'Expected object branch in filter schema'
    ).properties.nested,
    'Expected nested filter schema'
  );
  expect(nestedFilterSchema.examples?.[0] ?? nestedFilterSchema.example).toBe(
    'persian'
  );

  const detailsParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-query-rich`,
    'get',
    'details'
  );
  expect(detailsParam.schema).toEqual(
    expect.objectContaining({
      type: 'object',
      title: 'Details title from Valibot',
      description: 'Nested details from Valibot',
      properties: expect.objectContaining({
        label: expect.objectContaining({
          type: 'string',
          description: 'Nested label from Valibot'
        }),
        flags: expect.objectContaining({
          type: 'array',
          title: 'Flag list from Valibot'
        })
      })
    })
  );
  const detailsParamSchema = getInlinedSchema(detailsParam.schema);
  expect(
    getInlinedSchema(detailsParamSchema.properties.label).examples?.[0] ??
      getInlinedSchema(detailsParamSchema.properties.label).example
  ).toBe('primary');

  const idParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-param/{id}`,
    'get',
    'id'
  );
  expect(idParam.schema).toEqual(
    expect.objectContaining({
      type: 'string',
      minLength: 3,
      pattern: '^cat_[0-9]+$',
      description: 'Cat identifier from Zod'
    })
  );

  const stateParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-param-rich/{state}`,
    'get',
    'state'
  );
  expect(stateParam.schema).toEqual(
    expect.objectContaining({
      type: 'string',
      enum: ['available', 'resting'],
      title: 'CatState',
      description: 'Cat state enum from Zod'
    })
  );
  const stateParamSchema = getInlinedSchema(stateParam.schema);
  expect(stateParamSchema.examples?.[0] ?? stateParamSchema.example).toBe(
    'available'
  );

  const conflictingStateParam = getParameter(
    document,
    `${pathPrefix}/cats/standard-param-conflict/{state}`,
    'get',
    'state'
  );
  expect(conflictingStateParam.description).toBe(
    'Explicit param decorator description'
  );
  expect(conflictingStateParam.schema).toEqual(
    expect.objectContaining({
      type: 'string',
      enum: ['available', 'resting'],
      description: 'Param override from Zod',
      example: 'resting'
    })
  );

  const standardResponse = getResponse(
    getOperation(document, `${pathPrefix}/cats/standard-response`, 'get'),
    '200'
  );
  const standardResponseSchema = getSchemaFromResponse(standardResponse);
  expect(standardResponse.description).toBe('Standard schema response override');
  expect(standardResponseSchema).toEqual(
    expect.objectContaining({
      type: 'object',
      properties: expect.objectContaining({
        status: {
          type: 'string',
          enum: ['available', 'resting'],
          title: 'CatResponseState',
          description: 'Response status enum from Zod',
          example: 'available'
        },
        result: expect.objectContaining({
          title: 'StandardResponseResult',
          description: 'Response union from Zod'
        }),
        meta: expect.objectContaining({
          title: 'ResponseMeta',
          description: 'Nested response metadata from Zod',
          properties: expect.objectContaining({
            source: {
              type: 'string',
              description: 'Nested response source from Zod',
              example: 'cache'
            }
          })
        })
      })
    })
  );
  const standardResponseResultSchema = getInlinedSchema(
    standardResponseSchema.properties.result,
    'Expected inlined result schema'
  );
  expect(getUnionBranches(standardResponseResultSchema)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          kind: { enum: ['cat'], type: 'string' },
          cat: expect.objectContaining({
            type: 'object',
            properties: expect.objectContaining({
              name: {
                type: 'string',
                description: 'Returned cat name from Zod',
                example: 'Milo'
              }
            })
          })
        })
      }),
      expect.objectContaining({
        type: 'object',
        properties: expect.objectContaining({
          kind: { enum: ['message'], type: 'string' },
          message: {
            type: 'string',
            description: 'Returned message from Zod',
            example: 'No cat available'
          }
        })
      })
    ])
  );
  expect(
    standardResponseResultSchema.examples?.[0] ??
      standardResponseResultSchema.example
  ).toEqual({ kind: 'message', message: 'No cat available' });

  const conflictingStandardResponse = getResponse(
    getOperation(
      document,
      `${pathPrefix}/cats/standard-response-conflict`,
      'get'
    ),
    '200'
  );
  const conflictingStandardResponseContent = getResponseContent(
    conflictingStandardResponse
  );
  const conflictingStandardResponseSchema = getSchemaFromResponse(
    conflictingStandardResponse
  );
  expect(conflictingStandardResponse.description).toBe(
    'Standard schema response conflict override'
  );
  expect(conflictingStandardResponseContent.examples).toEqual({
    legacy: {
      summary: 'Decorator response example',
      value: { legacy: true }
    }
  });
  expect(conflictingStandardResponseSchema).toEqual(
    expect.objectContaining({
      type: 'object',
      properties: expect.objectContaining({
        result: {
          type: 'string',
          description: 'Response override from Zod',
          example: 'ok'
        },
        count: expect.objectContaining({
          type: 'integer',
          minimum: 1
        })
      })
    })
  );
}
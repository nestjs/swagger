import { Controller, Get, INestApplication, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import Fastify, { FastifyInstance } from 'fastify';
import SwaggerParser = require('@apidevtools/swagger-parser');
import {
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiSchema,
  createUnionApiSchema,
  DocumentBuilder,
  InferUnionApiSchema,
  ResponseObject,
  SwaggerModule
} from '../lib/index.js';
import { SchemaObject } from '../lib/interfaces/open-api-spec.interface.js';

class Cat {
  @ApiProperty({ enum: ['cat'] })
  kind: 'cat';

  @ApiProperty({ type: String })
  name: string;
}

const Scalar = createUnionApiSchema({
  name: 'Scalar',
  oneOf: [String, Number]
});
type Scalar = InferUnionApiSchema<typeof Scalar>;

const Mixed = createUnionApiSchema({ name: 'Mixed', oneOf: [Scalar, Cat] });
type Mixed = InferUnionApiSchema<typeof Mixed>;

@ApiSchema({ anyOf: [{ type: 'string' }, { enum: [null] }] })
class AlreadyNullable {}

const NullableResult = createUnionApiSchema({
  name: 'NullableResult',
  oneOf: [AlreadyNullable, Number]
});

class Payload {
  @ApiProperty({ type: () => Scalar, nullable: true })
  scalar: Scalar | null;

  @ApiProperty({ type: () => Mixed, nullable: true })
  mixed: Mixed | null;

  @ApiProperty({ type: AlreadyNullable, nullable: true })
  alreadyNullable: string | null;

  @ApiProperty({ type: () => Scalar, nullable: false })
  nonNullable: Scalar;
}

@Controller('union')
class UnionController {
  @Post()
  @ApiBody({ type: Payload })
  create() {}
}

describe('Reusable union payload validation', () => {
  let app: INestApplication;
  let validator: FastifyInstance;

  beforeAll(async () => {
    app = await NestFactory.create(
      { module: class {}, controllers: [UnionController] },
      { logger: false }
    );
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build()
    );

    // Validate the OpenAPI document and actual payloads independently. Disable
    // coercion so e.g. a boolean cannot pass by being converted to a string.
    await SwaggerParser.validate(JSON.parse(JSON.stringify(document)));
    validator = Fastify({
      ajv: { customOptions: { coerceTypes: false, strict: false } }
    });
    const schemas = document.components.schemas as Record<string, SchemaObject>;
    for (const property of [
      'scalar',
      'mixed',
      'alreadyNullable',
      'nonNullable'
    ]) {
      validator.post(
        `/${property}`,
        {
          schema: {
            body: {
              type: 'object',
              properties: { value: schemas.Payload.properties[property] },
              required: ['value'],
              components: document.components
            }
          }
        },
        async () => ({ valid: true })
      );
    }
    // Nullable use sites must not change the shared, non-nullable component.
    validator.post(
      '/non-nullable',
      {
        schema: {
          body: {
            type: 'object',
            properties: { value: { $ref: '#/components/schemas/Scalar' } },
            required: ['value'],
            components: document.components
          }
        }
      },
      async () => ({ valid: true })
    );
    await validator.ready();
  });

  afterAll(async () => {
    await validator?.close();
    await app?.close();
  });

  it.each([
    ['scalar', 'hello', 200],
    ['scalar', 42, 200],
    ['scalar', null, 200],
    ['scalar', false, 400],
    ['scalar', {}, 400],
    ['scalar', [], 400],
    ['mixed', 'hello', 200],
    ['mixed', 42, 200],
    ['mixed', { kind: 'cat', name: 'Milo' }, 200],
    ['mixed', null, 200],
    ['mixed', { kind: 'dog', name: 'Milo' }, 400],
    ['mixed', { kind: 'cat' }, 400],
    ['mixed', false, 400],
    ['alreadyNullable', null, 200],
    ['alreadyNullable', 'hello', 200],
    ['alreadyNullable', 42, 400],
    ['nonNullable', 42, 200],
    ['nonNullable', null, 400],
    ['non-nullable', 'hello', 200],
    ['non-nullable', null, 400]
  ])('validates /%s with %j as %i', async (path, value, status) => {
    const response = await validator.inject({
      method: 'POST',
      url: `/${path}`,
      payload: { value }
    });
    expect(response.statusCode).toBe(status);
  });
});

describe('Reusable union model registration', () => {
  it('rejects DTO property collisions instead of producing recursive union references', async () => {
    @ApiSchema({ name: 'Outer' })
    class NestedDto {
      @ApiProperty({ type: Number })
      id: number;
    }
    class MemberDto {
      @ApiProperty({ type: () => NestedDto })
      nested: NestedDto;
    }
    const Outer = createUnionApiSchema({
      name: 'Outer',
      oneOf: [MemberDto, String]
    });

    @Controller('collision')
    class CollisionController {
      @Post()
      @ApiBody({ type: Outer })
      create() {}
    }
    const app = await NestFactory.create(
      { module: class {}, controllers: [CollisionController] },
      { logger: false }
    );

    try {
      expect(() =>
        SwaggerModule.createDocument(app, new DocumentBuilder().build())
      ).toThrow(
        '[MemberDto] Different models cannot share the component schema "Outer"'
      );
    } finally {
      await app.close();
    }
  });

  it.each(['recursive member', 'inline object', 'named enum'])(
    'rejects component collisions reached through a %s',
    async (source) => {
      @ApiSchema({ name: 'Shared' })
      class FirstDto {}
      @ApiSchema({ name: 'Shared' })
      class SecondDto {}
      class MemberDto {}
      if (source === 'named enum') {
        ApiProperty({ enum: ['a', 'b'], enumName: 'Outer' })(
          MemberDto.prototype,
          'kind'
        );
      } else if (source === 'inline object') {
        ApiProperty({
          type: { first: { type: FirstDto }, second: { type: SecondDto } }
        })(MemberDto.prototype, 'nested');
      } else {
        ApiProperty({ type: FirstDto })(MemberDto.prototype, 'first');
        ApiProperty({ type: SecondDto })(MemberDto.prototype, 'second');
      }
      const Outer = createUnionApiSchema({
        name: 'Outer',
        oneOf: [MemberDto, String]
      });
      ApiProperty({ type: () => Outer, required: false })(
        MemberDto.prototype,
        'child'
      );

      @Controller('collision')
      class CollisionController {
        @Post()
        @ApiBody({ type: source === 'recursive member' ? MemberDto : Outer })
        create() {}
      }
      const app = await NestFactory.create(
        { module: class {}, controllers: [CollisionController] },
        { logger: false }
      );

      try {
        expect(() =>
          SwaggerModule.createDocument(app, new DocumentBuilder().build())
        ).toThrow(
          source === 'named enum'
            ? 'Models and enums cannot share the component schema "Outer"'
            : 'Different models cannot share the component schema "Shared"'
        );
      } finally {
        await app.close();
      }
    }
  );

  it.each([false, true])(
    'validates recursive inline properties and shared enums (member first: %s)',
    async (memberFirst) => {
      class BranchDto {
        @ApiProperty({ enum: ['branch'], enumName: 'Kind' })
        kind: 'branch';

        @ApiProperty({ enum: ['branch'], enumName: 'Kind', isArray: true })
        kinds: 'branch'[];
      }
      const Tree = createUnionApiSchema({
        name: 'Tree',
        oneOf: [BranchDto, String]
      });
      ApiProperty({
        type: { child: { type: () => Tree, required: true } },
        required: false
      })(BranchDto.prototype, 'nested');

      @Controller('tree')
      class TreeController {
        @Post()
        @ApiBody({ type: memberFirst ? BranchDto : Tree })
        create() {}
      }
      const app = await NestFactory.create(
        { module: class {}, controllers: [TreeController] },
        { logger: false }
      );
      const validator = Fastify({
        ajv: { customOptions: { coerceTypes: false, strict: false } }
      });

      try {
        const document = SwaggerModule.createDocument(
          app,
          new DocumentBuilder().build()
        );
        await SwaggerParser.validate(JSON.parse(JSON.stringify(document)));
        validator.post(
          '/',
          {
            schema: {
              body: {
                $ref: `#/components/schemas/${memberFirst ? 'BranchDto' : 'Tree'}`,
                components: document.components
              }
            }
          },
          async () => ({ valid: true })
        );
        const leaf = { kind: 'branch', kinds: ['branch'] };
        for (const [payload, status] of [
          [leaf, 200],
          [{ ...leaf, nested: { child: 'leaf' } }, 200],
          [{ ...leaf, nested: { child: leaf } }, 200],
          [{ ...leaf, kind: 'unknown' }, 400],
          [{ ...leaf, kinds: ['unknown'] }, 400],
          [{ ...leaf, nested: { child: false } }, 400]
        ] as const) {
          const response = await validator.inject({
            method: 'POST',
            url: '/',
            payload
          });
          expect(response.statusCode).toBe(status);
        }
      } finally {
        await validator.close();
        await app.close();
      }
    }
  );
});

describe.each(['3.0.3', '3.1.0'])(
  'Reusable union responses in OpenAPI %s',
  (version) => {
    let app: INestApplication;
    let validator: FastifyInstance;

    @Controller('responses')
    class ResponseController {
      @Get('scalar')
      @ApiOkResponse({ type: Scalar, nullable: true })
      scalar() {}

      @Get('nullable')
      @ApiOkResponse({ type: NullableResult, nullable: true })
      nullable() {}

      @Get('array')
      @ApiOkResponse({ type: [Scalar], nullable: true })
      array() {}

      @Get('non-nullable')
      @ApiOkResponse({ type: Scalar })
      nonNullable() {}
    }

    beforeAll(async () => {
      app = await NestFactory.create(
        { module: class {}, controllers: [ResponseController] },
        { logger: false }
      );
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setOpenAPIVersion(version).build()
      );
      if (version === '3.0.3') {
        // The installed parser supports OpenAPI 3.0. Payload checks below run
        // against the schemas generated for both document versions.
        await SwaggerParser.validate(JSON.parse(JSON.stringify(document)));
      }
      validator = Fastify({
        ajv: { customOptions: { coerceTypes: false, strict: false } }
      });
      for (const name of ['scalar', 'nullable', 'array', 'non-nullable']) {
        const response = document.paths[`/responses/${name}`].get.responses[
          '200'
        ] as ResponseObject;
        validator.post(
          `/${name}`,
          {
            schema: {
              body: {
                type: 'object',
                properties: {
                  value: response.content['application/json'].schema
                },
                required: ['value'],
                components: document.components
              }
            }
          },
          async () => ({ valid: true })
        );
      }
      await validator.ready();
    });

    afterAll(async () => {
      await validator?.close();
      await app?.close();
    });

    it.each([
      ['scalar', 'hello', 200],
      ['scalar', 42, 200],
      ['scalar', null, 200],
      ['scalar', false, 400],
      ['nullable', 'hello', 200],
      ['nullable', 42, 200],
      ['nullable', null, 200],
      ['nullable', false, 400],
      ['nullable', {}, 400],
      ['array', ['hello', 42], 200],
      ['array', [], 200],
      ['array', null, 200],
      ['array', [null], 400],
      ['array', [false], 400],
      ['array', 'hello', 400],
      ['non-nullable', 'hello', 200],
      ['non-nullable', null, 400]
    ])('validates the /%s response %j as %i', async (path, value, status) => {
      const response = await validator.inject({
        method: 'POST',
        url: `/${path}`,
        payload: { value }
      });
      expect(response.statusCode).toBe(status);
    });
  }
);

describe('Reusable unions and Standard Schema responses', () => {
  it.each([false, true])(
    'rejects competing component definitions (union first: %s)',
    async (unionFirst) => {
      const Shared = createUnionApiSchema({
        name: 'Shared',
        oneOf: [String, Number]
      });
      const convert = () => ({
        $ref: '#/$defs/Shared',
        $defs: { Shared: { type: 'boolean' } }
      });
      @Controller('standard')
      class StandardController {
        @Get()
        @ApiOkResponse({
          standardSchema: {
            '~standard': {
              version: 1,
              vendor: 'test',
              jsonSchema: { input: convert, output: convert }
            }
          }
        })
        response() {}
      }
      if (unionFirst) {
        ApiExtraModels(Shared)(StandardController);
      }
      const app = await NestFactory.create(
        { module: class {}, controllers: [StandardController] },
        { logger: false }
      );

      try {
        expect(() =>
          SwaggerModule.createDocument(app, new DocumentBuilder().build(), {
            extraModels: unionFirst ? [] : [Shared]
          })
        ).toThrow(
          'Standard Schema components cannot share the component schema "Shared"'
        );
      } finally {
        await app.close();
      }
    }
  );
});

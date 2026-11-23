import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import {
  ApiProperty,
  ApiResponse,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule global parameters and responses', () => {
  class StaffErrorDto {
    @ApiProperty()
    stackTrace: string;
  }

  @Controller('cats')
  class CatsController {
    @Get()
    findAll() {}
  }

  @Module({ controllers: [CatsController] })
  class AppModule {}

  it('applies them only to documents created from the same config', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const publicConfig = new DocumentBuilder().setTitle('public').build();
    const staffConfig = new DocumentBuilder()
      .setTitle('staff')
      .addGlobalParameters({ name: 'x-staff-id', in: 'header' })
      .addGlobalParameters({ name: 'x-tenant-id', in: 'header' })
      .addGlobalResponse({ status: 500, type: StaffErrorDto })
      .addGlobalResponse({ status: 400, description: 'Bad request' })
      .build();

    // A shallow copy of the config has to keep them too.
    for (const config of [staffConfig, { ...staffConfig }]) {
      const document = SwaggerModule.createDocument(app, config);
      const operation = document.paths['/cats'].get!;

      expect(operation.parameters!.map((param: any) => param.name)).toEqual([
        'x-staff-id',
        'x-tenant-id'
      ]);
      expect(Object.keys(operation.responses)).toEqual(['200', '400', '500']);
      expect(document.components!.schemas).toHaveProperty('StaffErrorDto');
      expect(Object.getOwnPropertySymbols(document)).toEqual([]);
    }

    const document = SwaggerModule.createDocument(app, publicConfig);
    const operation = document.paths['/cats'].get!;

    expect(operation.parameters).toEqual([]);
    expect(Object.keys(operation.responses)).toEqual(['200']);
    expect(document.components!.schemas).toEqual({});

    await app.close();
  });

  it('renders standard schemas from global, controller and method responses', async () => {
    const unauthorized = z.object({
      statusCode: z.literal(401),
      message: z.string()
    });
    const forbidden = z.object({ reason: z.string() });
    const notFound = z.object({ id: z.string() });

    @ApiResponse({ status: 403, standardSchema: forbidden })
    @Controller('dogs')
    class DogsController {
      @ApiResponse({ status: 404, standardSchema: notFound })
      @Get()
      findAll() {}

      @Get('count')
      count() {}
    }

    @Module({ controllers: [DogsController] })
    class DogsModule {}

    const app = await NestFactory.create(DogsModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .addGlobalResponse({ status: 401, standardSchema: unauthorized })
      .build();
    const document = SwaggerModule.createDocument(app, config);

    const toSchema = (schema: z.ZodType) =>
      schema['~standard'].jsonSchema.output({ target: 'openapi-3.0' });

    for (const path of ['/dogs', '/dogs/count']) {
      const responses = document.paths[path].get!.responses as any;
      expect(responses['401'].content['application/json'].schema).toEqual(
        toSchema(unauthorized)
      );
      expect(responses['403'].content['application/json'].schema).toEqual(
        toSchema(forbidden)
      );
    }
    expect(
      (document.paths['/dogs'].get!.responses as any)['404'].content[
        'application/json'
      ].schema
    ).toEqual(toSchema(notFound));

    await app.close();
  });
});

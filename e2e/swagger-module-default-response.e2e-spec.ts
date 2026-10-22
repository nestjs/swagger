import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiDefaultResponse,
  ApiProperty,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule default response', () => {
  class ErrorDto {
    @ApiProperty()
    message: string;
  }

  @Controller('cats')
  class CatsController {
    @Get()
    @ApiDefaultResponse({ type: ErrorDto, nullable: true })
    findAll() {}

    @Get('name')
    @ApiDefaultResponse({ type: String, nullable: true })
    findName() {}
  }

  @Module({ controllers: [CatsController] })
  class AppModule {}

  it('converts a nullable default response for OAS >= 3.1', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion('3.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const schemaOf = (path: string) =>
      (document.paths[path].get!.responses.default as any).content[
        'application/json'
      ].schema;

    expect(schemaOf('/cats')).toEqual({
      anyOf: [{ $ref: '#/components/schemas/ErrorDto' }, { type: 'null' }]
    });
    expect(schemaOf('/cats/name')).toEqual({ type: ['string', 'null'] });

    await app.close();
  });
});

import { Controller, Get, Module, Query } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiOkResponse,
  ApiProperty,
  ApiResponse,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule documents created from the same app', () => {
  const date = new Date('2025-01-01');

  class ReportDto {
    @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
    cells: (string | null)[];

    @ApiProperty({ oneOf: [{ type: 'string', nullable: true }] })
    value: string | null;

    @ApiProperty({
      type: 'object',
      additionalProperties: { type: 'string', default: date }
    })
    dates: Record<string, string>;

    @ApiProperty({
      type: 'object',
      properties: {
        nested: { type: 'object', example: { a: { b: { c: 1 } } } }
      }
    })
    meta: Record<string, unknown>;
  }

  class ReportQueryDto {
    @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
    tags: (string | null)[];
  }

  @Controller('reports')
  class ReportsController {
    @Get()
    @ApiOkResponse({ type: ReportDto })
    findAll(@Query() query: ReportQueryDto) {}

    @Get('raw')
    @ApiResponse({
      status: 200,
      schema: { type: 'array', items: { type: 'string', nullable: true } }
    })
    findRaw() {}
  }

  @Module({ controllers: [ReportsController] })
  class AppModule {}

  const propertiesOf = (document: any) =>
    document.components.schemas.ReportDto.properties;
  const operationSchemasOf = (document: any) => ({
    query: document.paths['/reports'].get.parameters[0].schema,
    response:
      document.paths['/reports/raw'].get.responses['200'].content[
        'application/json'
      ].schema
  });

  it('should not let one document alter the schemas of another', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const config = () =>
      new DocumentBuilder().setOpenAPIVersion('3.0.0').build();
    const first = SwaggerModule.createDocument(app, config());
    const expectedProperties = {
      cells: { type: 'array', items: { type: 'string', nullable: true } },
      value: { oneOf: [{ type: 'string', nullable: true }] },
      dates: {
        type: 'object',
        additionalProperties: { type: 'string', default: date }
      },
      meta: {
        type: 'object',
        properties: {
          nested: { type: 'object', example: { a: { b: { c: 1 } } } }
        }
      }
    };
    const nullableItems = {
      type: 'array',
      items: { type: 'string', nullable: true }
    };
    const expectedOperationSchemas = {
      query: nullableItems,
      response: nullableItems
    };
    expect(propertiesOf(first)).toEqual(expectedProperties);
    expect(operationSchemasOf(first)).toEqual(expectedOperationSchemas);

    const oas31 = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setOpenAPIVersion('3.1.0').build(),
      { excludeDynamicDefaults: true, exampleMaxDepth: 1 }
    );
    expect(propertiesOf(oas31)).toEqual({
      cells: { type: 'array', items: { type: ['string', 'null'] } },
      value: { oneOf: [{ type: ['string', 'null'] }] },
      dates: { type: 'object', additionalProperties: { type: 'string' } },
      meta: {
        type: 'object',
        properties: { nested: { type: 'object', example: { a: {} } } }
      }
    });

    // Neither the earlier document nor the decorator metadata is changed
    expect(propertiesOf(first)).toEqual(expectedProperties);
    expect(operationSchemasOf(first)).toEqual(expectedOperationSchemas);
    const next = SwaggerModule.createDocument(app, config());
    expect(propertiesOf(next)).toEqual(expectedProperties);
    expect(operationSchemasOf(next)).toEqual(expectedOperationSchemas);

    await app.close();
  });
});

import { Controller, Get, Module, Query } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiProperty,
  ApiQuery,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule excludeDynamicDefaults', () => {
  class ListQueryDto {
    @ApiProperty({ default: new Date('2025-01-01') })
    since: Date;

    @ApiProperty({ default: 10 })
    limit: number;
  }

  @Controller('cats')
  class CatsController {
    @Get()
    findAll(@Query() query: ListQueryDto) {}

    @Get('until')
    @ApiQuery({
      name: 'until',
      schema: { type: 'string', default: new Date('2025-01-01') }
    })
    findUntil() {}
  }

  @Module({ controllers: [CatsController] })
  class AppModule {}

  const config = new DocumentBuilder().setTitle('t').setVersion('1').build();
  const schemaOf = (document: any, path: string, name: string) =>
    document.paths[path].get.parameters.find((p: any) => p.name === name)
      .schema;

  it('strips dynamic defaults from query parameters', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const document = SwaggerModule.createDocument(app, config, {
      excludeDynamicDefaults: true
    });

    expect(schemaOf(document, '/cats', 'since')).not.toHaveProperty('default');
    expect(schemaOf(document, '/cats', 'limit').default).toBe(10);
    expect(schemaOf(document, '/cats/until', 'until')).not.toHaveProperty(
      'default'
    );

    // The decorator metadata is left untouched for later documents.
    const unfiltered = SwaggerModule.createDocument(app, config);
    expect(schemaOf(unfiltered, '/cats', 'since').default).toEqual(
      new Date('2025-01-01')
    );
    expect(schemaOf(unfiltered, '/cats/until', 'until').default).toEqual(
      new Date('2025-01-01')
    );

    await app.close();
  });
});

import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '../lib/index.js';

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
});

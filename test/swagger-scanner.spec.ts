import {
  Controller,
  Get,
  Global,
  INestApplication,
  Module
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '../lib';

describe('SwaggerScanner module imports', () => {
  @Controller('root')
  class RootController {
    @Get()
    find() {}
  }

  @Controller('ordinary')
  class OrdinaryController {
    @Get()
    find() {}
  }

  @Controller('decorator-global')
  class DecoratorGlobalController {
    @Get()
    find() {}
  }

  @Controller('dynamic-global')
  class DynamicGlobalController {
    @Get()
    find() {}
  }

  @Module({ controllers: [OrdinaryController] })
  class OrdinaryModule {}

  @Global()
  @Module({ controllers: [DecoratorGlobalController] })
  class DecoratorGlobalModule {}

  @Module({})
  class DynamicGlobalModule {}

  @Module({
    controllers: [RootController],
    imports: [
      OrdinaryModule,
      DecoratorGlobalModule,
      {
        module: DynamicGlobalModule,
        global: true,
        controllers: [DynamicGlobalController]
      }
    ]
  })
  class RootModule {}

  let app: INestApplication;
  const config = new DocumentBuilder().setTitle('Test').setVersion('1').build();

  beforeAll(async () => {
    app = await NestFactory.create(RootModule, { logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('excludes decorator and dynamic global imports when deep scanning', () => {
    const document = SwaggerModule.createDocument(app, config, {
      include: [RootModule],
      deepScanRoutes: true
    });

    expect(Object.keys(document.paths).sort()).toEqual(['/ordinary', '/root']);
  });

  it('only scans the selected module when deep scanning is disabled', () => {
    const document = SwaggerModule.createDocument(app, config, {
      include: [RootModule],
      deepScanRoutes: false
    });

    expect(Object.keys(document.paths)).toEqual(['/root']);
  });

  it('still scans global modules when explicitly included', () => {
    const document = SwaggerModule.createDocument(app, config, {
      include: [DecoratorGlobalModule, DynamicGlobalModule],
      deepScanRoutes: true
    });

    expect(Object.keys(document.paths).sort()).toEqual([
      '/decorator-global',
      '/dynamic-global'
    ]);
  });
});

import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ApiBearerAuth, DocumentBuilder, SwaggerModule } from '../lib';

describe('SwaggerModule handlers sharing a path and method', () => {
  @Controller('patterns')
  class PatternsController {
    @Get('wildcard-first/:path')
    @ApiBearerAuth()
    protectedParam() {}

    @Get('wildcard-first/*path')
    openWildcard() {}

    @Get('wildcard-last/:path')
    openParam() {}

    @Get('wildcard-last/*path')
    @ApiBearerAuth()
    protectedWildcard() {}

    @Get('legacy-wildcard/:path')
    @ApiBearerAuth()
    protectedLegacyParam() {}

    @Get('legacy-wildcard/*')
    openLegacyWildcard() {}

    @Get('group-first/:id')
    @ApiBearerAuth()
    protectedRequired() {}

    @Get('group-first{/:id}')
    openOptional() {}

    @Get('group-last/:id')
    openRequired() {}

    @Get('group-last{/:id}')
    @ApiBearerAuth()
    protectedOptional() {}

    @Get('single/:id')
    @ApiBearerAuth()
    single() {}
  }

  @Controller('regexps')
  class RegexpsController {
    @Get('first/:ref(^\\d+)')
    @ApiBearerAuth()
    protectedFirst() {}

    @Get('first/:ref')
    openLast() {}

    @Get('last/:ref')
    openFirst() {}

    @Get('last/:ref(^\\d+)')
    @ApiBearerAuth()
    protectedLast() {}
  }

  @Module({ controllers: [PatternsController] })
  class AppModule {}

  @Module({ controllers: [RegexpsController] })
  class FastifyAppModule {}

  const bearer = [{ bearer: [] }];
  const config = new DocumentBuilder().addBearerAuth().build();

  it('keeps the security requirements of every route pattern', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    const document = SwaggerModule.createDocument(app, config);
    await app.close();

    [
      ['/patterns/wildcard-first/{path}', 'openWildcard'],
      ['/patterns/wildcard-last/{path}', 'protectedWildcard'],
      ['/patterns/legacy-wildcard/{path}', 'openLegacyWildcard'],
      ['/patterns/group-first/{id}', 'openOptional'],
      ['/patterns/group-last/{id}', 'protectedOptional'],
      ['/patterns/single/{id}', 'single']
    ].forEach(([path, handler]) => {
      expect(document.paths[path].get).toMatchObject({
        operationId: `PatternsController_${handler}`,
        security: bearer
      });
    });
  });

  it('keeps the security requirements of every inline regexp (fastify)', async () => {
    const app = await NestFactory.create(
      FastifyAppModule,
      new FastifyAdapter(),
      { logger: false }
    );
    await app.init();
    const document = SwaggerModule.createDocument(app, config);
    await app.close();

    expect(document.paths['/regexps/first/{ref}'].get).toMatchObject({
      operationId: 'RegexpsController_openLast',
      security: bearer
    });
    expect(document.paths['/regexps/last/{ref}'].get).toMatchObject({
      operationId: 'RegexpsController_protectedLast',
      security: bearer
    });
  });
});

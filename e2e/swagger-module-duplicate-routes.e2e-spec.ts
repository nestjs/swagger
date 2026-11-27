import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  DocumentBuilder,
  SwaggerModule
} from '../lib';

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

  @Controller('defaults')
  class DefaultsController {
    @Get('open-first/:path')
    @ApiOperation({ security: [] })
    openParam() {}

    @Get('open-first/*path')
    defaultWildcard() {}

    @Get('open-last/:path')
    defaultParam() {}

    @Get('open-last/*path')
    @ApiOperation({ security: [] })
    openWildcard() {}

    @Get('scheme-first/:id')
    @ApiSecurity('partner-key')
    partnerRequired() {}

    @Get('scheme-first{/:id}')
    defaultOptional() {}

    @Get('scheme-last/:id')
    defaultRequired() {}

    @Get('scheme-last{/:id}')
    @ApiSecurity('partner-key')
    partnerOptional() {}

    @Get('all-default/:path')
    defaultFirst() {}

    @Get('all-default/*path')
    defaultLast() {}
  }

  @Controller('anonymous')
  class AnonymousController {
    @Get('empty-list-first/:path')
    @ApiOperation({ security: [] })
    emptyListParam() {}

    @Get('empty-list-first/*path')
    @ApiBearerAuth()
    guardedWildcard() {}

    @Get('empty-list-last/:path')
    @ApiBearerAuth()
    guardedParam() {}

    @Get('empty-list-last/*path')
    @ApiOperation({ security: [] })
    emptyListWildcard() {}

    @Get('empty-object-first/:path')
    @ApiSecurity({})
    emptyObjectParam() {}

    @Get('empty-object-first/*path')
    @ApiBearerAuth()
    guardedAfterEmptyObject() {}

    @Get('empty-object-last/:path')
    @ApiBearerAuth()
    guardedBeforeEmptyObject() {}

    @Get('empty-object-last/*path')
    @ApiSecurity({})
    emptyObjectWildcard() {}

    @Get('operation-empty-object/:id')
    @ApiBearerAuth()
    guardedRequired() {}

    @Get('operation-empty-object{/:id}')
    @ApiOperation({ security: [{}] })
    emptyObjectOptional() {}

    @Get('optional-first/:path')
    @ApiOperation({ security: [{ bearer: [] }, {}] })
    optionalParam() {}

    @Get('optional-first/*path')
    @ApiBearerAuth()
    guardedAfterOptional() {}

    @Get('optional-last/:path')
    @ApiBearerAuth()
    guardedBeforeOptional() {}

    @Get('optional-last/*path')
    @ApiOperation({ security: [{ bearer: [] }, {}] })
    optionalWildcard() {}

    @Get('optional-open/:path')
    @ApiOperation({ security: [{ bearer: [] }, {}] })
    optionalBeforeOpen() {}

    @Get('optional-open/*path')
    @ApiOperation({ security: [] })
    openAfterOptional() {}

    @Get('all-empty-object/:path')
    @ApiSecurity({})
    emptyObjectFirst() {}

    @Get('all-empty-object/*path')
    @ApiOperation({ security: [{}] })
    emptyObjectLast() {}

    @Get('default-first/:path')
    defaultParam() {}

    @Get('default-first/*path')
    @ApiSecurity({})
    emptyObjectAfterDefault() {}

    @Get('default-last/:path')
    @ApiSecurity({})
    emptyObjectBeforeDefault() {}

    @Get('default-last/*path')
    defaultWildcard() {}
  }

  @Module({ controllers: [PatternsController] })
  class AppModule {}

  @Module({ controllers: [DefaultsController] })
  class DefaultsAppModule {}

  @Module({ controllers: [AnonymousController] })
  class AnonymousAppModule {}

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

  it('keeps the document-wide security requirements of handlers that declare none', async () => {
    const partnerKey = { 'partner-key': [] };
    const configWithDefault = new DocumentBuilder()
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header' }, 'partner-key')
      .addSecurityRequirements('bearer')
      .build();

    const app = await NestFactory.create(DefaultsAppModule, { logger: false });
    await app.init();
    const document = SwaggerModule.createDocument(app, configWithDefault);
    const documentWithoutDefault = SwaggerModule.createDocument(app, config);
    await app.close();

    const securityOf = (doc: typeof document, path: string) =>
      doc.paths[`/defaults/${path}`].get!.security;

    expect(document.security).toEqual(bearer);
    expect(securityOf(document, 'open-first/{path}')).toEqual(bearer);
    expect(securityOf(document, 'open-last/{path}')).toEqual(bearer);
    expect(securityOf(document, 'scheme-first/{id}')).toEqual([
      partnerKey,
      ...bearer
    ]);
    expect(securityOf(document, 'scheme-last/{id}')).toEqual([
      ...bearer,
      partnerKey
    ]);
    expect(securityOf(document, 'all-default/{path}')).toBeUndefined();
    expect(securityOf(document, 'open-last/{path}')![0]).not.toBe(
      configWithDefault.security![0]
    );

    // Without document-wide requirements, nothing is added.
    expect(securityOf(documentWithoutDefault, 'open-first/{path}')).toBe(
      undefined
    );
    expect(securityOf(documentWithoutDefault, 'open-last/{path}')).toEqual([]);
    expect(securityOf(documentWithoutDefault, 'scheme-first/{id}')).toEqual([
      partnerKey
    ]);
    expect(securityOf(documentWithoutDefault, 'all-default/{path}')).toBe(
      undefined
    );
  });

  it('allows anonymous access only if every handler allows it', async () => {
    const configWithDefault = new DocumentBuilder()
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const app = await NestFactory.create(AnonymousAppModule, {
      logger: false
    });
    await app.init();
    const document = SwaggerModule.createDocument(app, config);
    const documentWithDefault = SwaggerModule.createDocument(
      app,
      configWithDefault
    );
    await app.close();

    const securityOf = (doc: typeof document, path: string) =>
      doc.paths[`/anonymous/${path}`].get!.security;

    [
      'empty-list-first/{path}',
      'empty-list-last/{path}',
      'empty-object-first/{path}',
      'empty-object-last/{path}',
      'operation-empty-object/{id}',
      'optional-first/{path}',
      'optional-last/{path}'
    ].forEach((path) => {
      expect(securityOf(document, path)).toEqual(bearer);
      expect(securityOf(documentWithDefault, path)).toEqual(bearer);
    });

    // Every handler can be called without credentials.
    expect(securityOf(document, 'optional-open/{path}')).toEqual([
      ...bearer,
      {}
    ]);
    expect(securityOf(document, 'all-empty-object/{path}')).toEqual([{}]);
    expect(securityOf(document, 'default-first/{path}')).toEqual([{}]);
    expect(securityOf(document, 'default-last/{path}')).toEqual([{}]);

    // A handler that declares none requires the document-wide bearer token.
    expect(securityOf(documentWithDefault, 'default-first/{path}')).toEqual(
      bearer
    );
    expect(securityOf(documentWithDefault, 'default-last/{path}')).toEqual(
      bearer
    );
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

import { Controller, Get, Headers } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '../lib';

describe('SwaggerModule - Security scheme header filtering', () => {
  @Controller('test')
  class TestController {
    @Get('bearer')
    getWithAuthHeader(@Headers('Authorization') auth: string) {
      return auth;
    }

    @Get('custom-header')
    getWithCustomHeader(@Headers('X-Custom') custom: string) {
      return custom;
    }
  }

  let app;

  beforeAll(async () => {
    app = await NestFactory.create(
      {
        module: class {},
        controllers: [TestController]
      },
      { logger: false }
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should filter out Authorization header parameter when bearer auth is configured', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const params = document.paths['/test/bearer']?.get?.parameters || [];

    // The Authorization header should NOT appear as a parameter
    const authParam = params.find(
      (p: any) => p.in === 'header' && p.name === 'Authorization'
    );
    expect(authParam).toBeUndefined();
  });

  it('should filter out Authorization header parameter when basic auth is configured', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .addBasicAuth()
      .addSecurityRequirements('basic')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const params = document.paths['/test/bearer']?.get?.parameters || [];

    const authParam = params.find(
      (p: any) => p.in === 'header' && p.name === 'Authorization'
    );
    expect(authParam).toBeUndefined();
  });

  it('should filter out custom API key header parameter when apiKey scheme uses it', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Custom' }, 'custom')
      .addSecurityRequirements('custom')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const params =
      document.paths['/test/custom-header']?.get?.parameters || [];

    const customParam = params.find(
      (p: any) => p.in === 'header' && p.name === 'X-Custom'
    );
    expect(customParam).toBeUndefined();
  });

  it('should NOT filter out non-security header parameters', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const params =
      document.paths['/test/custom-header']?.get?.parameters || [];

    // X-Custom header should still appear since it's not a security header
    const customParam = params.find(
      (p: any) => p.in === 'header' && p.name === 'X-Custom'
    );
    expect(customParam).toBeDefined();
  });

  it('should not filter any headers when no security schemes are configured', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const params = document.paths['/test/bearer']?.get?.parameters || [];

    // Authorization should still appear since there are no security schemes
    const authParam = params.find(
      (p: any) => p.in === 'header' && p.name === 'Authorization'
    );
    expect(authParam).toBeDefined();
  });

  it('should handle case-insensitive header name matching', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const bearerParams = document.paths['/test/bearer']?.get?.parameters || [];

    // Even though @Headers('Authorization') uses title case,
    // it should be filtered since bearer auth uses the Authorization header
    const authParam = bearerParams.find(
      (p: any) =>
        p.in === 'header' && p.name.toLowerCase() === 'authorization'
    );
    expect(authParam).toBeUndefined();
  });
});

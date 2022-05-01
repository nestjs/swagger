import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';

describe('Fastify Swagger', () => {
  let app: NestFastifyApplication;
  let builder: DocumentBuilder;

  beforeEach(async () => {
    app = await NestFactory.create<NestFastifyApplication>(
      ApplicationModule,
      new FastifyAdapter(),
      { logger: false }
    );

    builder = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .addTag('cats')
      .addBasicAuth()
      .addBearerAuth()
      .addOAuth2()
      .addApiKey()
      .addApiKey({}, 'key1')
      .addApiKey({}, 'key2')
      .addCookieAuth()
      .addSecurityRequirements('bearer')
      .addSecurityRequirements({ basic: [], cookie: [] });
  });

  it('should produce a valid OpenAPI 3.0 schema', async () => {
    const document = SwaggerModule.createDocument(app, builder.build());
    const doc = JSON.stringify(document, null, 2);

    try {
      let api = await SwaggerParser.validate(document as any);
      console.log(
        'API name: %s, Version: %s',
        api.info.title,
        api.info.version
      );
      expect(api.info.title).toEqual('Cats example');
    } catch (err) {
      console.log(doc);
      expect(err).toBeUndefined();
    }
  });

  it('should fix colons in url', async () => {
    const document = SwaggerModule.createDocument(app, builder.build());
    expect(document.paths['/fastify:colon:another/{prop}']).toBeDefined();
  });

  it('should pass uiConfig options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    const uiConfig = {
      displayOperationId: true,
      persistAuthorization: true
    };
    const options = { uiConfig };
    SwaggerModule.setup('/swagger1', app, document1, options);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/uiConfig'
      });

      expect(response.statusCode).toEqual(200);
      expect(JSON.parse(response.body)).toEqual(uiConfig);
    });
  });

  it('should setup multiple routes', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger1', app, document1);

    const document2 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('/swagger2', app, document2);

    await app.init();
    // otherwise throws "FastifyError [FST_ERR_DEC_ALREADY_PRESENT]: FST_ERR_DEC_ALREADY_PRESENT: The decorator 'swagger' has already been added!"
    await expect(
      app.getHttpAdapter().getInstance().ready()
    ).resolves.toBeDefined();
  });

  it('should pass initOAuth options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    const initOAuth = {
      scopes: ['openid', 'profile', 'email', 'offline_access']
    };
    const options = { initOAuth };
    SwaggerModule.setup('/swagger1', app, document1, options);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/initOAuth'
      });

      expect(response.statusCode).toEqual(200);
      expect(JSON.parse(response.body)).toEqual(initOAuth);
    });
  });

  it('should pass staticCSP = undefined options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup('swagger1', app, document1);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/json'
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-security-policy']).toBeUndefined();
    });
  });

  it('should pass staticCSP = true options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    const options = { staticCSP: true };
    SwaggerModule.setup('/swagger1', app, document1, options);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/json'
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-security-policy']).toContain(`script-src 'self' 'sha256`);
      expect(response.headers['content-security-policy']).toContain(`style-src 'self' https: 'sha256`);
    });
  });

  it('should pass staticCSP = false options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    const options = { staticCSP: false };
    SwaggerModule.setup('/swagger1', app, document1, options);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/json'
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-security-policy']).toBeUndefined();
    });
  });

  it('should pass transformStaticCSP = function options to fastify-swagger', async () => {
    const document1 = SwaggerModule.createDocument(app, builder.build());
    const checkParam = jest.fn((param: string) => param);
    const options = {
      staticCSP: `default-src 'self';`,
      transformStaticCSP: (header: string) => {
        checkParam(header);
        return `default-src 'self'; script-src 'self';`
      }
    };
    SwaggerModule.setup('/swagger1', app, document1, options);

    const instance = await app.getHttpAdapter().getInstance().ready();

    instance.ready(async () => {
      const response = await instance.inject({
        method: 'GET',
        url: '/swagger1/json'
      });

      expect(checkParam).toBeCalledWith(`default-src 'self';`);
      expect(response.statusCode).toEqual(200);
      expect(response.headers['content-security-policy']).toEqual(`default-src 'self'; script-src 'self';`);
    });
  });
});

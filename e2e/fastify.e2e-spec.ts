import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';
import * as path from 'path';

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
      .addApiKey({ type: 'apiKey' }, 'key1')
      .addApiKey({ type: 'apiKey' }, 'key2')
      .addCookieAuth()
      .addSecurityRequirements('bearer')
      .addSecurityRequirements({ basic: [], cookie: [] })
      .addGlobalParameters({
        name: 'x-tenant-id',
        in: 'header',
        schema: { type: 'string' }
      });
  });

  it('should produce a valid OpenAPI 3.0 schema', async () => {
    const document = SwaggerModule.createDocument(app, builder.build());
    const doc = JSON.stringify(document, null, 2);

    try {
      const api = await SwaggerParser.validate(document as any);
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

  describe('served swagger ui', () => {
    const SWAGGER_RELATIVE_URL = '/apidoc';

    beforeEach(async () => {
      const swaggerDocument = SwaggerModule.createDocument(
        app,
        builder.build(),
      );
      SwaggerModule.setup(SWAGGER_RELATIVE_URL, app, swaggerDocument, {
        // to showcase that in new implementation u can use custom swagger-ui path. Useful when using e.g. webpack
        customSwaggerUiPath: path.resolve(`./node_modules/swagger-ui-dist`),
      });

      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('content type of served json document should be valid', async () => {
      const response = await request(app.getHttpServer()).get(
        `${SWAGGER_RELATIVE_URL}-json`
      );

      expect(response.status).toEqual(200);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    it('content type of served static should be available', async () => {
      const response = await request(app.getHttpServer()).get(
        `${SWAGGER_RELATIVE_URL}/swagger-ui-bundle.js`
      );

      expect(response.status).toEqual(200);
    });
  });

  describe('custom documents endpoints', () => {
    const JSON_CUSTOM_URL = '/apidoc-json';
    const YAML_CUSTOM_URL = '/apidoc-yaml';

    beforeEach(async () => {
      const swaggerDocument = SwaggerModule.createDocument(
        app,
        builder.build()
      );
      SwaggerModule.setup('api', app, swaggerDocument, {
        jsonDocumentUrl: JSON_CUSTOM_URL,
        yamlDocumentUrl: YAML_CUSTOM_URL,
        patchDocumentOnRequest: (req, res, document) => ({
          ...document,
          info: {
            ...document.info,
            description: (req as Record<string, any>).query.description
          }
        })
      });

      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('json document should be server in the custom url', async () => {
      const response = await request(app.getHttpServer()).get(JSON_CUSTOM_URL);

      expect(response.status).toEqual(200);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    it('patched JSON document should be served', async () => {
      const response = await request(app.getHttpServer()).get(
        `${JSON_CUSTOM_URL}?description=My%20custom%20description`
      );

      expect(response.body.info.description).toBe("My custom description");
    });

    it('yaml document should be server in the custom url', async () => {
      const response = await request(app.getHttpServer()).get(YAML_CUSTOM_URL);

      expect(response.status).toEqual(200);
      expect(response.text.length).toBeGreaterThan(0);
    });

    it('patched YAML document should be served', async () => {
      const response = await request(app.getHttpServer()).get(
        `${YAML_CUSTOM_URL}?description=My%20custom%20description`
      );
      expect(response.text).toContain("My custom description");
    });
  });

  describe('custom documents endpoints with global prefix', () => {
    let appGlobalPrefix: NestFastifyApplication;

    const GLOBAL_PREFIX = '/v1';
    const JSON_CUSTOM_URL = '/apidoc-json';
    const YAML_CUSTOM_URL = '/apidoc-yaml';

    beforeEach(async () => {
      appGlobalPrefix = await NestFactory.create<NestFastifyApplication>(
        ApplicationModule,
        new FastifyAdapter(),
        { logger: false }
      );
      appGlobalPrefix.setGlobalPrefix(GLOBAL_PREFIX);

      const swaggerDocument = SwaggerModule.createDocument(
        appGlobalPrefix,
        builder.build()
      );
      SwaggerModule.setup('api', appGlobalPrefix, swaggerDocument, {
        useGlobalPrefix: true,
        jsonDocumentUrl: JSON_CUSTOM_URL,
        yamlDocumentUrl: YAML_CUSTOM_URL
      });

      await appGlobalPrefix.init();
      await appGlobalPrefix.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
      await appGlobalPrefix.close();
    });

    it('json document should be server in the custom url', async () => {
      const response = await request(appGlobalPrefix.getHttpServer()).get(
        `${GLOBAL_PREFIX}${JSON_CUSTOM_URL}`
      );

      expect(response.status).toEqual(200);
      expect(Object.keys(response.body).length).toBeGreaterThan(0);
    });

    it('yaml document should be server in the custom url', async () => {
      const response = await request(appGlobalPrefix.getHttpServer()).get(
        `${GLOBAL_PREFIX}${YAML_CUSTOM_URL}`
      );

      expect(response.status).toEqual(200);
      expect(response.text.length).toBeGreaterThan(0);
    });
  });

  describe('custom swagger options', () => {
    const CUSTOM_CSS = 'body { background-color: hotpink !important }';
    const CUSTOM_JS = '/foo.js';
    const CUSTOM_JS_STR = 'console.log("foo")';
    const CUSTOM_FAVICON = '/foo.ico';
    const CUSTOM_SITE_TITLE = 'Foo';
    const CUSTOM_CSS_URL = '/foo.css';

    beforeEach(async () => {
      const swaggerDocument = SwaggerModule.createDocument(
        app,
        builder.build()
      );

      SwaggerModule.setup('/custom', app, swaggerDocument, {
        customCss: CUSTOM_CSS,
        customJs: CUSTOM_JS,
        customJsStr: CUSTOM_JS_STR,
        customfavIcon: CUSTOM_FAVICON,
        customSiteTitle: CUSTOM_SITE_TITLE,
        customCssUrl: CUSTOM_CSS_URL,
        patchDocumentOnRequest: (req, res, document) => ({
          ...document,
          info: {
            ...document.info,
            description: (req as Record<string, any>).query.description
          }
        })
      });

      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });

    it('should contain the custom css string', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(CUSTOM_CSS);
    });

    it('should source the custom js url', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(`script src='${CUSTOM_JS}'></script>`);
    });

    it('should contain the custom js string', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(CUSTOM_JS_STR);
    });

    it('should contain the custom favicon', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(
        `<link rel='icon' href='${CUSTOM_FAVICON}' />`
      );
    });

    it('should contain the custom site title', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(`<title>${CUSTOM_SITE_TITLE}</title>`);
    });

    it('should include the custom stylesheet', async () => {
      const response: Response = await request(app.getHttpServer()).get(
        '/custom'
      );
      expect(response.text).toContain(
        `<link href='${CUSTOM_CSS_URL}' rel='stylesheet'>`
      );
    });

    it('should patch the OpenAPI document', async function () {
      const response: Response = await request(app.getHttpServer()).get(
        "/custom/swagger-ui-init.js?description=Custom%20Swagger%20description%20passed%20by%20query%20param"
      );
      expect(response.text).toContain(
        `"description": "Custom Swagger description passed by query param"`
      );
    });

    it('should patch the OpenAPI document based on path param of the swagger prefix', async () => {
      const app = await NestFactory.create<NestFastifyApplication>(
        ApplicationModule,
        new FastifyAdapter(),
        { logger: false }
      );

      const swaggerDocument = SwaggerModule.createDocument(
        app,
        builder.build()
      );

      SwaggerModule.setup('/:tenantId/', app, swaggerDocument, {
        patchDocumentOnRequest<ExpressRequest, ExpressResponse> (req, res, document) {
          return {
            ...document,
            info: {
              description: `${req.params.tenantId}'s API documentation`
            }
          }
        }
      });

      await app.init();
      await app.getHttpAdapter().getInstance().ready();

      const response: Response = await request(app.getHttpServer()).get('/tenant-1/swagger-ui-init.js');

      await app.close();
      expect(response.text).toContain("tenant-1's API documentation");
    })

    afterEach(async () => {
      await app.close();
    });
  });
});

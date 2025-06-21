import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import { join } from 'path';
import * as SwaggerParser from 'swagger-parser';
import {
  DocumentBuilder,
  getSchemaPath,
  OpenAPIObject,
  SwaggerModule
} from '../lib';
import { SchemaObject } from '../lib/interfaces/open-api-spec.interface';
import { ApplicationModule } from './src/app.module';
import { Cat } from './src/cats/classes/cat.class';
import { TagDto } from './src/cats/dto/tag.dto';
import { ValidationErrorDto } from './src/common/dto/validation-error.dto';
import { ExpressController } from './src/express.controller';

describe('Validate OpenAPI schema', () => {
  let app: INestApplication;
  let options: Omit<OpenAPIObject, 'paths'>;

  beforeEach(async () => {
    app = await NestFactory.create(
      {
        module: class {},
        imports: [ApplicationModule],
        controllers: [ExpressController]
      },
      {
        logger: false
      }
    );
    app.setGlobalPrefix('api/');
    app.enableVersioning();

    options = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .setBasePath('api')
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
      .addGlobalResponse({
        status: 500,
        description: 'Internal server error'
      })
      .addGlobalResponse({
        status: 400,
        description: 'Bad request',
        type: ValidationErrorDto
      })
      .addGlobalParameters({
        name: 'x-tenant-id',
        in: 'header',
        schema: { type: 'string' }
      })
      .addExtension('x-test', { test: 'test' })
      .addExtension('x-logo', { url: 'https://example.com/logo.png' }, 'info')
      .build();
  });

  it('should produce a valid OpenAPI 3.0 schema', async () => {
    await SwaggerModule.loadPluginMetadata(async () => ({
      '@nestjs/swagger': {
        models: [
          [
            import('./src/cats/classes/cat.class'),
            {
              Cat: {
                tags: {
                  description: 'Tags of the cat',
                  example: ['tag1', 'tag2'],
                  required: false
                },
                siblings: {
                  required: false,
                  type: () => ({
                    ids: { required: true, type: () => Number }
                  })
                }
              }
            }
          ],
          [
            import('./src/cats/dto/create-cat.dto'),
            {
              CreateCatDto: {
                enumWithDescription: {
                  enum: await import(
                    './src/cats/dto/pagination-query.dto'
                  ).then((f) => f.LettersEnum)
                },
                name: {
                  description: 'Name of the cat'
                }
              }
            }
          ]
        ],
        controllers: [
          [
            import('./src/cats/cats.controller'),
            {
              CatsController: {
                findAllBulk: {
                  type: [
                    await import('./src/cats/classes/cat.class').then(
                      (f) => f.Cat
                    )
                  ],
                  summary: 'Find all cats in bulk'
                }
              }
            }
          ]
        ]
      }
    }));
    const document = SwaggerModule.createDocument(app, options);

    const doc = JSON.stringify(document, null, 2);
    writeFileSync(join(__dirname, 'api-spec.json'), doc);

    try {
      const api = (await SwaggerParser.validate(
        document as any
      )) as OpenAPIV3.Document;
      console.log(
        'API name: %s, Version: %s',
        api.info.title,
        api.info.version
      );
      expect(api.info.title).toEqual('Cats example');
      expect(
        api.components.schemas['Cat']['x-schema-extension']['test']
      ).toEqual('test');
      expect(
        api.components.schemas['Cat']['x-schema-extension-multiple']['test']
      ).toEqual('test*2');
      expect(
        api.paths['/api/cats']['post']['callbacks']['myEvent'][
          '{$request.body#/callbackUrl}'
        ]['post']['requestBody']['content']['application/json']['schema'][
          'properties'
        ]['breed']['type']
      ).toEqual('string');
      expect(
        api.paths['/api/cats']['post']['callbacks']['mySecondEvent'][
          '{$request.body#/callbackUrl}'
        ]['post']['requestBody']['content']['application/json']['schema'][
          'properties'
        ]['breed']['type']
      ).toEqual('string');
      expect(api.paths['/api/cats']['get']['x-codeSamples'][0]['lang']).toEqual(
        'JavaScript'
      );
      expect(api.paths['/api/cats']['get']['x-multiple']['test']).toEqual(
        'test'
      );
      expect(api.paths['/api/cats']['get']['tags']).toContain('tag1');
      expect(api.paths['/api/cats']['get']['tags']).toContain('tag2');
    } catch (err) {
      console.log(doc);
      expect(err).toBeUndefined();
    }
  });

  it('should fix colons in url', async () => {
    const document = SwaggerModule.createDocument(app, options);
    expect(
      document.paths['/api/v1/express:colon:another/{prop}']
    ).toBeDefined();
  });

  it('should merge custom components passed via config', async () => {
    const components = {
      schemas: {
        Person: {
          oneOf: [
            {
              $ref: getSchemaPath(Cat)
            },
            {
              $ref: getSchemaPath(TagDto)
            }
          ],
          discriminator: {
            propertyName: '_resolveType',
            mapping: {
              cat: getSchemaPath(Cat),
              tag: getSchemaPath(TagDto)
            }
          }
        }
      }
    };

    const document = SwaggerModule.createDocument(app, {
      ...options,
      components: {
        ...options.components,
        ...components
      }
    });

    const api = (await SwaggerParser.validate(
      document as any
    )) as OpenAPIV3.Document;
    console.log('API name: %s, Version: %s', api.info.title, api.info.version);
    expect(api.components.schemas).toHaveProperty('Person');
    expect(api.components.schemas).toHaveProperty('Cat');
  });

  it('should consider explicit config over auto-detected schema', () => {
    const document = SwaggerModule.createDocument(app, options);
    expect(document.paths['/api/cats/download'].get.responses).toEqual({
      '200': {
        description: 'binary file for download',
        content: {
          'application/pdf': {
            schema: { type: 'string', format: 'binary' }
          },
          'image/jpeg': { schema: { type: 'string', format: 'binary' } }
        }
      }
    });
  });

  it('should not add optional properties to required list', () => {
    const document = SwaggerModule.createDocument(app, options);
    const required = (document.components?.schemas?.Cat as SchemaObject)
      ?.required;
    expect(required).not.toContain('optionalRawDefinition');
  });

  it('should fail if extension is not prefixed with x-', () => {
    expect(() =>
      new DocumentBuilder().addExtension('test', { test: 'test' }).build()
    ).toThrow(
      'Extension key is not prefixed. Please ensure you prefix it with `x-`.'
    );
  });

  it('should add extension to root', () => {
    const document = SwaggerModule.createDocument(app, options);
    expect(document['x-test']).toEqual({ test: 'test' });
  });

  it('should add extension to info', () => {
    const document = SwaggerModule.createDocument(app, options);
    expect(document.info['x-logo']).toEqual({
      url: 'https://example.com/logo.png'
    });
  });
});

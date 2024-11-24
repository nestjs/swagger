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
import { ApplicationModule } from './src/app.module';
import { Cat } from './src/cats/classes/cat.class';
import { TagDto } from './src/cats/dto/tag.dto';
import { DogsModule } from './src/dogs/dogs.module';

describe('Validate OpenAPI schema', () => {
  let app: INestApplication;
  let options: Omit<OpenAPIObject, 'paths'>;

  beforeEach(async () => {
    app = await NestFactory.create(ApplicationModule, {
      logger: false
    });
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
      .addGlobalParameters({
        name: 'x-tenant-id',
        in: 'header',
        schema: { type: 'string' }
      })
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
      ).toEqual('test');
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

    let api = (await SwaggerParser.validate(
      document as any
    )) as OpenAPIV3.Document;
    console.log('API name: %s, Version: %s', api.info.title, api.info.version);
    expect(api.components.schemas).toHaveProperty('Person');
    expect(api.components.schemas).toHaveProperty('Cat');
  });

  it('should consider explicit config over auto-detected schema', async () => {
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
});

describe('Nested module scanning', () => {
  let app: INestApplication;
  let options: Omit<OpenAPIObject, 'paths'>;

  beforeEach(async () => {
    app = await NestFactory.create(DogsModule, {
      logger: false
    });
    app.setGlobalPrefix('api/');

    options = new DocumentBuilder()
      .setTitle('Cats example')
      .setDescription('The cats API description')
      .setVersion('1.0')
      .build();
  });

  describe('deepScanRoutes', () => {
    it('should include only 1-depth nested routes when deepScanRoutes is true', async () => {
      const document = SwaggerModule.createDocument(app, options, {
        deepScanRoutes: true,
        include: [DogsModule]
      });

      // Root module routes should be included
      expect(document.paths['/api/dogs']).toBeDefined();
      expect(document.paths['/api/dogs/puppies']).toBeDefined();

      // First depth routes should be included
      expect(document.paths['/api/depth1-dogs']).toBeDefined();

      // Deeper routes should NOT be included
      expect(document.paths['/api/depth2-dogs']).toBeUndefined();
      expect(document.paths['/api/depth3-dogs']).toBeUndefined();

      // Verify controller tags are correct
      expect(document.paths['/api/dogs'].get.tags).toContain('dogs');
      expect(document.paths['/api/depth1-dogs'].get.tags).toContain('depth1-dogs');
    });
  });

  describe('recursiveModuleScan', () => {
    it('should include all nested routes when recursiveModuleScan is enabled', async () => {
      const document = SwaggerModule.createDocument(app, options, {
        include: [DogsModule],
        deepScanRoutes: true,
        recursiveModuleScan: true
      });

      // All routes at every depth should be included
      expect(document.paths['/api/dogs']).toBeDefined();
      expect(document.paths['/api/dogs/puppies']).toBeDefined();
      expect(document.paths['/api/depth1-dogs']).toBeDefined();
      expect(document.paths['/api/depth2-dogs']).toBeDefined();
      expect(document.paths['/api/depth3-dogs']).toBeDefined();

      // Verify all controller tags are correct
      expect(document.paths['/api/dogs'].get.tags).toContain('dogs');
      expect(document.paths['/api/depth1-dogs'].get.tags).toContain('depth1-dogs');
      expect(document.paths['/api/depth2-dogs'].get.tags).toContain('depth2-dogs');
      expect(document.paths['/api/depth3-dogs'].get.tags).toContain('depth3-dogs');
    });
  });

  describe('maxScanDepth', () => {
    it('should limit scanning depth when maxScanDepth is set', async () => {
      const document = SwaggerModule.createDocument(app, options, {
        include: [DogsModule],
        deepScanRoutes: true,
        recursiveModuleScan: true,
        maxScanDepth: 1
      });

      // Routes up to depth 1 should be included
      expect(document.paths['/api/dogs']).toBeDefined();
      expect(document.paths['/api/dogs/puppies']).toBeDefined();
      expect(document.paths['/api/depth1-dogs']).toBeDefined();

      // Routes beyond depth 1 should NOT be included
      expect(document.paths['/api/depth2-dogs']).toBeUndefined();
      expect(document.paths['/api/depth3-dogs']).toBeUndefined();

      // Verify included controller tags are correct
      expect(document.paths['/api/dogs'].get.tags).toContain('dogs');
      expect(document.paths['/api/depth1-dogs'].get.tags).toContain('depth1-dogs');
    });

    it('should include routes up to specified maxScanDepth', async () => {
      const document = SwaggerModule.createDocument(app, options, {
        include: [DogsModule],
        deepScanRoutes: true,
        recursiveModuleScan: true,
        maxScanDepth: 2
      });

      // Routes up to depth 2 should be included
      expect(document.paths['/api/dogs']).toBeDefined();
      expect(document.paths['/api/dogs/puppies']).toBeDefined();
      expect(document.paths['/api/depth1-dogs']).toBeDefined();
      expect(document.paths['/api/depth2-dogs']).toBeDefined();

      // Routes beyond depth 2 should NOT be included
      expect(document.paths['/api/depth3-dogs']).toBeUndefined();

      // Verify included controller tags are correct
      expect(document.paths['/api/dogs'].get.tags).toContain('dogs');
      expect(document.paths['/api/depth1-dogs'].get.tags).toContain('depth1-dogs');
      expect(document.paths['/api/depth2-dogs'].get.tags).toContain('depth2-dogs');
    });
  });
});

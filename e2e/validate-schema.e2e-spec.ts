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
                  example: ['tag1', 'tag2']
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
      const api = await SwaggerParser.validate(document as any);
      console.log(
        'API name: %s, Version: %s',
        api.info.title,
        api.info.version
      );
      expect(api.info.title).toEqual('Cats example');
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
});

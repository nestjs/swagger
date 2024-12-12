import { INestApplication, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule
} from '../lib';
import { ApplicationModule } from './src/dog-app.module';

describe('Validate header-based versioned OpenAPI schema', () => {
  let app: INestApplication;
  let options: Omit<OpenAPIObject, 'paths'>;

  beforeEach(async () => {
    app = await NestFactory.create(ApplicationModule, {
      logger: false
    });
    app.setGlobalPrefix('api/');
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: 'x-api-version',
      defaultVersion: VERSION_NEUTRAL
    });

    options = new DocumentBuilder()
      .setTitle('Dogs example')
      .setDescription('The dogs API description')
      .setVersion('1.0')
      .setBasePath('api')
      .addTag('dogs')
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
      .addGlobalParameters({
        name: 'x-api-version',
        in: 'header',
        schema: { type: 'string' }
      })
      .build();

    await SwaggerModule.loadPluginMetadata(async () => ({
      '@nestjs/swagger': {
        models: [
          [
            import('./src/dogs/classes/dog.class'),
            {
              Dog: {
                tags: {
                  description: 'Tags of the dog',
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
            import('./src/dogs/dto/create-dog.dto'),
            {
              CreateDogDto: {
                name: {
                  description: 'Name of the dog'
                }
              }
            }
          ]
        ],
        controllers: [
          [
            import('./src/dogs/dogs.controller'),
            {
              DogsController: {
                findAllBulk: {
                  type: [
                    await import('./src/dogs/classes/dog.class').then(
                      (f) => f.Dog
                    )
                  ],
                  summary: 'Find all dogs in bulk'
                }
              }
            }
          ]
        ]
      }
    }));
  });

  it('should produce a valid OpenAPI 3.0 schema with versions split by modified path', async () => {
    const api = SwaggerModule.createDocument(app, options);
    console.log(
      'API name: %s, Version: %s',
      api.info.title,
      api.info.version
    );
    expect(api.info.title).toEqual('Dogs example');

    expect(api.paths['/api/dogs']['get']).toBeDefined();

    expect(api.paths['/api/dogs version: v0']['post']['operationId']).toBe('DogsController_createNewV0');
    expect(
      api.paths['/api/dogs version: v0']['post']['responses']['200']['content']['application/json']['schema']['type']
    ).toBe('array');

    expect(api.paths['/api/dogs version: v1']['post']['operationId']).toBe('DogsController_createNewV1');
    expect(
      api.paths['/api/dogs version: v1']['post']['responses']['200']['content']['application/json']['schema']['type']
    ).toBe('string');

    expect(api.paths['/api/dogs version: v2']['post']['operationId']).toBe('DogsController_createNewV2');
    expect(
      api.paths['/api/dogs version: v2']['post']['responses']['200']['content']['application/json']['schema']['type']
    ).toBe('array');
  });
});

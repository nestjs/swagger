import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import type { OpenAPIV3 } from 'openapi-types';
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
      .build();
  });

  it('should produce a valid OpenAPI 3.0 schema', async () => {
    const document = SwaggerModule.createDocument(app, options);

    const doc = JSON.stringify(document, null, 2);
    writeFileSync(join(__dirname, 'api-spec.json'), doc);

    try {
      let api = await SwaggerParser.validate(document as any);
      console.log(
        'API name: %s, Version: %s',
        api.info.title,
        api.info.version
      );
      expect(api.info.title).toEqual('Cats example');
      expect(api.paths['/api/cats']['get']['x-codeSamples'][0]['lang']).toEqual(
        'JavaScript'
      );
    } catch (err) {
      console.log(doc);
      expect(err).toBeUndefined();
    }
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

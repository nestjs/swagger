import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as SwaggerParser from 'swagger-parser';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerModule
} from '../lib';
import { ApplicationModule } from './src/app.module';
import { BarModule } from './src/bar/bar.module';
import { FooModule } from './src/foo/foo.module';
import { IncludeExcludeModule } from './src/include-exclude.module';

describe('Validate OpenAPI schema', () => {
  describe('general schema', () => {
    let document: OpenAPIObject;
    beforeEach(async () => {
      const app = await NestFactory.create(ApplicationModule, {
        logger: false
      });
      app.setGlobalPrefix('api/');

      const options = new DocumentBuilder()
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

      document = SwaggerModule.createDocument(app, options);
    });

    it('should produce a valid OpenAPI 3.0 schema', async () => {
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
        expect(
          api.paths['/api/cats']['get']['x-codeSamples'][0]['lang']
        ).toEqual('JavaScript');
      } catch (err) {
        console.log(doc);
        expect(err).toBeUndefined();
      }
    });
  });

  describe('include/exclude', () => {
    const createDocument = async (swaggerOptions?: SwaggerDocumentOptions) => {
      const app = await NestFactory.create(IncludeExcludeModule, {
        logger: false
      });
      app.setGlobalPrefix('api/');

      const options = new DocumentBuilder()
        .setTitle('Include/Exclude')
        .setVersion('1.0')
        .setBasePath('api')
        .build();

      return SwaggerModule.createDocument(app, options, swaggerOptions);
    };

    it('should exclude specified modules', async () => {
      const doc = await createDocument({
        exclude: [FooModule]
      });
      const keys = Object.keys(doc.paths).sort();
      expect(keys).toEqual(['/api/bar', '/api/baz']);
    });

    it('should exclude multiple modules', async () => {
      const doc = await createDocument({
        exclude: [FooModule, BarModule]
      });
      const keys = Object.keys(doc.paths).sort();
      expect(keys).toEqual(['/api/baz']);
    });

    it('should include specified modules', async () => {
      const doc = await createDocument({
        include: [FooModule]
      });
      const keys = Object.keys(doc.paths).sort();
      expect(keys).toEqual(['/api/foo']);
    });

    it('should include multiple modules', async () => {
      const doc = await createDocument({
        include: [FooModule, BarModule]
      });
      const keys = Object.keys(doc.paths).sort();
      expect(keys).toEqual(['/api/bar', '/api/foo']);
    });

    it('should throw if include/exclude are specified together', async () => {
      await expect(async () => {
        await createDocument({
          include: [FooModule],
          exclude: [BarModule]
        });
      }).rejects.toThrow('Cannot specify both include and exclude together');
    });
  });
});

import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as SwaggerParser from 'swagger-parser';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '../lib';
import { ApplicationModule } from './src/app.module';

describe('Validate OpenAPI schema', () => {
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
      .addCookieAuth()
      .addSecurityRequirements('bearer')
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
      expect(api.paths['/api/cats']['get']['x-codeSamples'][0]['lang']).toEqual(
        'JavaScript'
      );
    } catch (err) {
      console.log(doc);
      expect(err).toBeUndefined();
    }
  });
});

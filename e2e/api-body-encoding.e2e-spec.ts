import { Controller, INestApplication, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiBody, ApiConsumes, DocumentBuilder, SwaggerModule } from '../lib';

@Controller('upload')
class UploadController {
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    },
    encoding: {
      tags: {
        style: 'form',
        explode: true
      }
    }
  })
  upload() {
    return 'uploaded';
  }

  @Post('no-encoding')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    }
  })
  uploadWithoutEncoding() {
    return 'uploaded';
  }
}

describe('ApiBody encoding', () => {
  let app: INestApplication;
  let document: ReturnType<typeof SwaggerModule.createDocument>;

  beforeAll(async () => {
    app = await NestFactory.create(
      {
        module: class {},
        controllers: [UploadController]
      },
      { logger: false }
    );

    const options = new DocumentBuilder()
      .setTitle('Encoding Test')
      .setVersion('1.0')
      .build();

    document = SwaggerModule.createDocument(app, options);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should include encoding in requestBody content', () => {
    const requestBody = document.paths['/upload'].post.requestBody as any;
    const content = requestBody.content['multipart/form-data'];

    expect(content.schema).toBeDefined();
    expect(content.encoding).toBeDefined();
    expect(content.encoding.tags).toEqual({
      style: 'form',
      explode: true
    });
  });

  it('should preserve schema when encoding is present', () => {
    const requestBody = document.paths['/upload'].post.requestBody as any;
    const content = requestBody.content['multipart/form-data'];

    expect(content.schema.type).toBe('object');
    expect(content.schema.properties.tags).toEqual({
      type: 'array',
      items: { type: 'string' }
    });
    expect(content.schema.properties.file).toEqual({
      type: 'string',
      format: 'binary'
    });
  });

  it('should not include encoding when not specified', () => {
    const requestBody = document.paths['/upload/no-encoding'].post
      .requestBody as any;
    const content = requestBody.content['multipart/form-data'];

    expect(content.schema).toBeDefined();
    expect(content.encoding).toBeUndefined();
  });
});
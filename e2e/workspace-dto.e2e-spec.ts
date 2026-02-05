import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '../lib';
import { WorkspaceController } from './src/workspace/workspace.controller';
import { WorkspaceModule } from './src/workspace/workspace.module';

describe('Workspace DTO schema ref issue (#3652)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeEach(async () => {
    app = await NestFactory.create(
      {
        module: class {},
        imports: [WorkspaceModule],
        controllers: [WorkspaceController]
      },
      {
        logger: false
      }
    );

    const config = new DocumentBuilder()
      .setTitle('Workspace API')
      .setVersion('1.0')
      .build();

    document = SwaggerModule.createDocument(app, config);
    writeFileSync(
      join(__dirname, 'workspace-dto-spec.json'),
      JSON.stringify(document, null, 2)
    );
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should register WorkspaceDto in components.schemas', () => {
    expect(document.components?.schemas?.WorkspaceDto).toBeDefined();
    expect(document.components?.schemas?.WorkspaceDto).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string', example: 'my-workspace' },
        slug: { type: 'string', example: 'acme-corp' },
        memberCount: { type: 'number', example: 10 }
      },
      required: ['name']
    });
  });

  it('POST /workspace/body should use $ref to WorkspaceDto', () => {
    const path = document.paths['/workspace/body'];
    expect(path).toBeDefined();

    const requestBody = path.post?.requestBody;
    expect(requestBody).toBeDefined();

    const schema = (requestBody as any)?.content?.['application/json']?.schema;
    expect(schema).toEqual({
      $ref: '#/components/schemas/WorkspaceDto'
    });
  });

  it('GET /workspace/query should use $ref for query parameters (fixed behavior)', () => {
    const path = document.paths['/workspace/query'];
    expect(path).toBeDefined();

    const parameters = path.get?.parameters;
    expect(parameters).toBeDefined();
    expect(Array.isArray(parameters)).toBe(true);

    const hasRefParam = (parameters as any[])?.some((p) => p.$ref);
    expect(hasRefParam).toBe(true);

    const nameParamRef = (parameters as any[])?.find(
      (p) => p.$ref && p.$ref.includes('name')
    );
    expect(nameParamRef).toBeDefined();
    expect(nameParamRef.$ref).toMatch(
      /^#\/components\/parameters\/.*_name_query$/
    );
  });

  it('components.parameters should contain WorkspaceDto parameter definitions', () => {
    expect(document.components?.parameters).toBeDefined();

    const nameParamKey = 'QueryParam_name_query';
    const slugParamKey = 'QueryParam_slug_query';
    const memberCountParamKey = 'QueryParam_memberCount_query';

    expect(document.components?.parameters?.[nameParamKey]).toMatchObject({
      name: 'name',
      in: 'query',
      required: true,
      schema: {
        type: 'string',
        example: 'my-workspace'
      }
    });

    expect(document.components?.parameters?.[slugParamKey]).toMatchObject({
      name: 'slug',
      in: 'query',
      required: false,
      schema: {
        type: 'string',
        example: 'acme-corp'
      }
    });

    expect(document.components?.parameters?.[memberCountParamKey]).toMatchObject(
      {
        name: 'memberCount',
        in: 'query',
        required: false,
        schema: {
          type: 'number',
          example: 10
        }
      }
    );
  });

  it('should use $ref for both @Body and @Query to avoid duplication', () => {
    const bodyRef = (document.paths['/workspace/body']?.post?.requestBody as any)
      ?.content?.['application/json']?.schema?.$ref;
    const queryParams = document.paths['/workspace/query']?.get?.parameters;

    expect(bodyRef).toBe('#/components/schemas/WorkspaceDto');
    expect(Array.isArray(queryParams)).toBe(true);
    expect((queryParams as any[]).length).toBeGreaterThan(0);

    const allQueryParamsUseRef = (queryParams as any[]).every((p) => p.$ref);
    expect(allQueryParamsUseRef).toBe(true);
  });
});

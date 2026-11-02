import { DocumentBuilder } from '../lib/document-builder';
import { GLOBAL_RESPONSES } from '../lib/interfaces/global-metadata.interface';

describe('DocumentBuilder', () => {
  describe('addTag', () => {
    it('should add tag with name and description (backward compatibility)', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations');
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations'
      });
      expect(doc.tags[0]).not.toHaveProperty('parent');
      expect(doc.tags[0]).not.toHaveProperty('kind');
    });

    it('should add tag with parent option', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations', undefined, {
        parent: 'Animals'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        parent: 'Animals'
      });
    });

    it('should add tag with kind option', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Internal', 'Internal APIs', undefined, {
        kind: 'audience'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Internal',
        description: 'Internal APIs',
        kind: 'audience'
      });
    });

    it('should add tag with a free-form (custom) kind value', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Beta', 'Beta endpoints', undefined, {
        kind: 'lifecycle-stage'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Beta',
        description: 'Beta endpoints',
        kind: 'lifecycle-stage'
      });
    });

    it('should add tag with both parent and kind options', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations', undefined, {
        parent: 'Animals',
        kind: 'nav'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        parent: 'Animals',
        kind: 'nav'
      });
    });

    it('should add tag with summary option', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations', undefined, {
        summary: 'Cats'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        summary: 'Cats'
      });
    });

    it('should add tag with summary, parent and kind options', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations', undefined, {
        summary: 'Cats',
        parent: 'Animals',
        kind: 'navigation'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        summary: 'Cats',
        parent: 'Animals',
        kind: 'navigation'
      });
    });

    it('should add tag with externalDocs and hierarchy options', () => {
      const builder = new DocumentBuilder();
      builder.addTag(
        'Cats',
        'Cat operations',
        { url: 'https://example.com/cats' },
        { parent: 'Animals', kind: 'nav' }
      );
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        externalDocs: { url: 'https://example.com/cats' },
        parent: 'Animals',
        kind: 'nav'
      });
    });

    it('should add multiple tags with hierarchy', () => {
      const builder = new DocumentBuilder();
      builder
        .addTag('Animals', 'All animal operations')
        .addTag('Cats', 'Cat operations', undefined, { parent: 'Animals' })
        .addTag('Dogs', 'Dog operations', undefined, { parent: 'Animals' });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(3);
      expect(doc.tags[0]).toEqual({
        name: 'Animals',
        description: 'All animal operations'
      });
      expect(doc.tags[1]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        parent: 'Animals'
      });
      expect(doc.tags[2]).toEqual({
        name: 'Dogs',
        description: 'Dog operations',
        parent: 'Animals'
      });
    });
  });

  describe('setOpenAPIVersion', () => {
    it('accepts a three-part numeric version with single-digit segments', () => {
      const builder = new DocumentBuilder().setOpenAPIVersion('3.1.0');
      expect(builder.build().openapi).toBe('3.1.0');
    });

    it('accepts a version with multi-digit segments', () => {
      // OpenAPI spec versions follow semver; segments may have multiple digits
      // (e.g. 3.0.10, 3.10.0). The previous `^\d\.\d\.\d$` regex rejected those.
      const builder1 = new DocumentBuilder().setOpenAPIVersion('3.0.10');
      expect(builder1.build().openapi).toBe('3.0.10');

      const builder2 = new DocumentBuilder().setOpenAPIVersion('3.10.0');
      expect(builder2.build().openapi).toBe('3.10.0');

      const builder3 = new DocumentBuilder().setOpenAPIVersion('10.20.30');
      expect(builder3.build().openapi).toBe('10.20.30');
    });

    it('rejects malformed versions and keeps the default', () => {
      const defaultVersion = new DocumentBuilder().build().openapi;

      const builder = new DocumentBuilder().setOpenAPIVersion('not-a-version');
      expect(builder.build().openapi).toBe(defaultVersion);

      const builder2 = new DocumentBuilder().setOpenAPIVersion('3.0');
      expect(builder2.build().openapi).toBe(defaultVersion);

      const builder3 = new DocumentBuilder().setOpenAPIVersion('3.0.0-beta');
      expect(builder3.build().openapi).toBe(defaultVersion);
    });
  });

  describe('build', () => {
    it('returns a snapshot that later builder calls do not alter', () => {
      const createBuilder = () =>
        new DocumentBuilder()
          .setTitle('Admin')
          .addServer('https://admin.example')
          .addTag('admin')
          .addExtension('x-audience', 'admin', 'info')
          .addBearerAuth()
          .addSecurityRequirements('bearer');

      const builder = createBuilder();
      const adminConfig = builder.build();
      const partnerConfig = builder
        .setTitle('Partner')
        .setContact('Partner', 'https://partner.example', 'p@partner.example')
        .addServer('https://partner.example')
        .addTag('partner')
        .addExtension('x-audience', 'partner', 'info')
        .addExtension('x-partner', true)
        .addApiKey({ type: 'apiKey' }, 'partner_key')
        .addSecurityRequirements('partner_key')
        .build();

      expect(adminConfig).toEqual(createBuilder().build());
      expect(partnerConfig.info.title).toEqual('Partner');
      expect(partnerConfig.security).toEqual([
        { bearer: [] },
        { partner_key: [] }
      ]);
    });

    it('does not let changes to a built config reach the builder', () => {
      const builder = new DocumentBuilder().setTitle('Cats');
      const config = builder.build();
      config.info.title = 'Dogs';
      config.servers.push({ url: 'https://dogs.example' });

      expect(builder.build().info.title).toEqual('Cats');
      expect(builder.build().servers).toEqual([]);
    });
  });

  describe('addGlobalResponse', () => {
    it('normalises the type and description of global responses', () => {
      class ErrorDto {}

      const config = new DocumentBuilder()
        .addGlobalResponse(
          { status: 500, type: [ErrorDto] },
          { status: 401 },
          { status: 400, description: 'Bad request', type: ErrorDto }
        )
        .build();

      expect(config[GLOBAL_RESPONSES]).toEqual({
        500: { description: '', type: ErrorDto, isArray: true },
        401: { description: '' },
        400: { description: 'Bad request', type: ErrorDto, isArray: false }
      });
    });

    it('does not change the responses it is given', () => {
      class ErrorDto {}
      const response = { status: 500, type: [ErrorDto] };

      new DocumentBuilder().addGlobalResponse(response);

      expect(response).toEqual({ status: 500, type: [ErrorDto] });
    });
  });
});

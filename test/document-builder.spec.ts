import { DocumentBuilder } from '../lib/document-builder';

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
        kind: 'reference'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Internal',
        description: 'Internal APIs',
        kind: 'reference'
      });
    });

    it('should add tag with both parent and kind options', () => {
      const builder = new DocumentBuilder();
      builder.addTag('Cats', 'Cat operations', undefined, {
        parent: 'Animals',
        kind: 'navigation'
      });
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
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
        { parent: 'Animals', kind: 'navigation' }
      );
      const doc = builder.build();

      expect(doc.tags).toHaveLength(1);
      expect(doc.tags[0]).toEqual({
        name: 'Cats',
        description: 'Cat operations',
        externalDocs: { url: 'https://example.com/cats' },
        parent: 'Animals',
        kind: 'navigation'
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
});

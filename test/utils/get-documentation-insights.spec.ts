import { describe, it, expect } from 'vitest';
import { getDocumentationInsights } from '../../lib/utils/get-documentation-insights.util';
import { OpenAPIObject } from '../../lib/interfaces/open-api-spec.interface';

function buildDocument(overrides: Partial<OpenAPIObject> = {}): OpenAPIObject {
  return {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {},
    ...overrides
  };
}

describe('getDocumentationInsights', () => {
  describe('perfect document', () => {
    it('returns score 100 and grade A for a fully documented API', () => {
      const document = buildDocument({
        paths: {
          '/users': {
            get: {
              summary: 'List users',
              description: 'Returns a paginated list of all users.',
              tags: ['Users'],
              responses: {
                '200': { description: 'Success' }
              }
            }
          }
        },
        components: {
          schemas: {
            UserDto: {
              type: 'object',
              description: 'Represents a system user.',
              properties: {
                id: { type: 'string', description: 'Unique identifier.' },
                email: {
                  type: 'string',
                  description: 'User email address.'
                }
              }
            }
          }
        }
      });

      const { summary, insights } = getDocumentationInsights(document);

      expect(summary.score).toBe(100);
      expect(summary.grade).toBe('A');
      expect(summary.totalEndpoints).toBe(1);
      expect(summary.documentedEndpoints).toBe(1);
      expect(summary.totalSchemas).toBe(1);
      expect(summary.documentedSchemas).toBe(1);
      expect(summary.totalProperties).toBe(2);
      expect(summary.documentedProperties).toBe(2);
      expect(insights).toHaveLength(0);
    });
  });

  describe('empty paths and schemas', () => {
    it('scores 100 when no paths or schemas exist', () => {
      const document = buildDocument({ paths: {} });
      const { summary, insights } = getDocumentationInsights(document);

      expect(summary.score).toBe(100);
      expect(summary.grade).toBe('A');
      expect(insights).toHaveLength(0);
    });
  });

  describe('missing operation summary', () => {
    it('emits an error insight for each operation without a summary', () => {
      const document = buildDocument({
        paths: {
          '/items': {
            get: {
              tags: ['Items'],
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const summaryInsight = insights.find(
        (i) => i.code === 'MISSING_OPERATION_SUMMARY'
      );

      expect(summaryInsight).toBeDefined();
      expect(summaryInsight!.severity).toBe('error');
      expect(summaryInsight!.location).toBe('GET /items');
    });
  });

  describe('missing operation description', () => {
    it('emits a warning for each operation without a description', () => {
      const document = buildDocument({
        paths: {
          '/items': {
            post: {
              summary: 'Create item',
              tags: ['Items'],
              responses: { '201': { description: 'Created' } }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const descInsight = insights.find(
        (i) => i.code === 'MISSING_OPERATION_DESCRIPTION'
      );

      expect(descInsight).toBeDefined();
      expect(descInsight!.severity).toBe('warning');
    });
  });

  describe('missing operation tags', () => {
    it('emits a warning when an operation has no tags', () => {
      const document = buildDocument({
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              description: 'Returns 200 when the service is healthy.',
              responses: { '200': { description: 'OK' } }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const tagInsight = insights.find(
        (i) => i.code === 'MISSING_OPERATION_TAGS'
      );

      expect(tagInsight).toBeDefined();
      expect(tagInsight!.location).toBe('GET /health');
    });
  });

  describe('missing success response', () => {
    it('emits an error when no 2xx response is documented', () => {
      const document = buildDocument({
        paths: {
          '/broken': {
            delete: {
              summary: 'Delete something',
              description: 'Deletes something.',
              tags: ['Things'],
              responses: {
                '401': { description: 'Unauthorized' }
              }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const responseInsight = insights.find(
        (i) => i.code === 'MISSING_SUCCESS_RESPONSE'
      );

      expect(responseInsight).toBeDefined();
      expect(responseInsight!.severity).toBe('error');
    });

    it('accepts any 2xx status code as a valid success response', () => {
      for (const code of ['200', '201', '204', '206']) {
        const document = buildDocument({
          paths: {
            '/resource': {
              get: {
                summary: 'Get',
                description: 'Get it.',
                tags: ['Resource'],
                responses: { [code]: { description: 'Success' } }
              }
            }
          }
        });

        const { insights } = getDocumentationInsights(document);
        expect(
          insights.find((i) => i.code === 'MISSING_SUCCESS_RESPONSE')
        ).toBeUndefined();
      }
    });
  });

  describe('deprecated without description', () => {
    it('emits a warning for deprecated operations without a description', () => {
      const document = buildDocument({
        paths: {
          '/old-endpoint': {
            get: {
              summary: 'Old endpoint',
              deprecated: true,
              tags: ['Legacy'],
              responses: { '200': { description: 'OK' } }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const deprecatedInsight = insights.find(
        (i) => i.code === 'DEPRECATED_WITHOUT_DESCRIPTION'
      );

      expect(deprecatedInsight).toBeDefined();
      expect(deprecatedInsight!.severity).toBe('warning');
      expect(deprecatedInsight!.location).toBe('GET /old-endpoint');
    });

    it('does not warn when a deprecated operation has a description', () => {
      const document = buildDocument({
        paths: {
          '/old-endpoint': {
            get: {
              summary: 'Old endpoint',
              description: 'Deprecated. Use GET /new-endpoint instead.',
              deprecated: true,
              tags: ['Legacy'],
              responses: { '200': { description: 'OK' } }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      expect(
        insights.find((i) => i.code === 'DEPRECATED_WITHOUT_DESCRIPTION')
      ).toBeUndefined();
    });
  });

  describe('schema documentation', () => {
    it('emits an info insight for schemas without a description', () => {
      const document = buildDocument({
        components: {
          schemas: {
            OrderDto: {
              type: 'object',
              properties: {}
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const schemaInsight = insights.find(
        (i) => i.code === 'MISSING_SCHEMA_DESCRIPTION'
      );

      expect(schemaInsight).toBeDefined();
      expect(schemaInsight!.severity).toBe('info');
      expect(schemaInsight!.location).toBe('schema:OrderDto');
    });

    it('emits an info insight for each property without a description', () => {
      const document = buildDocument({
        components: {
          schemas: {
            ProductDto: {
              type: 'object',
              description: 'A sellable product.',
              properties: {
                id: { type: 'string' },
                price: { type: 'number' }
              }
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const propInsights = insights.filter(
        (i) => i.code === 'MISSING_PROPERTY_DESCRIPTION'
      );

      expect(propInsights).toHaveLength(2);
      expect(propInsights.map((i) => i.location)).toEqual(
        expect.arrayContaining([
          'schema:ProductDto.id',
          'schema:ProductDto.price'
        ])
      );
    });

    it('skips $ref entries in schemas and properties', () => {
      const document = buildDocument({
        components: {
          schemas: {
            RefOnly: { $ref: '#/components/schemas/Other' },
            WithRefProp: {
              type: 'object',
              description: 'Has a ref property.',
              properties: {
                nested: { $ref: '#/components/schemas/Other' }
              }
            }
          }
        }
      });

      const { summary, insights } = getDocumentationInsights(document);

      // RefOnly schema itself is skipped; WithRefProp has one property (ref) skipped
      expect(summary.totalProperties).toBe(0);
      expect(
        insights.find((i) => i.code === 'MISSING_PROPERTY_DESCRIPTION')
      ).toBeUndefined();
    });
  });

  describe('scoring', () => {
    it('reduces score proportionally for undocumented endpoints', () => {
      const document = buildDocument({
        paths: {
          '/a': {
            get: {
              summary: 'A',
              description: 'A.',
              tags: ['A'],
              responses: { '200': { description: 'OK' } }
            }
          },
          '/b': {
            get: {
              responses: { '200': { description: 'OK' } }
            }
          }
        }
      });

      const { summary } = getDocumentationInsights(document);

      expect(summary.totalEndpoints).toBe(2);
      expect(summary.documentedEndpoints).toBe(1);
      // 1/2 endpoints documented * 60% weight = 30; schemas/properties = 100% * 40% = 40; total = 70
      expect(summary.score).toBe(70);
      expect(summary.grade).toBe('C');
    });

    it('assigns grade F when score is below 60', () => {
      const paths: OpenAPIObject['paths'] = {};
      for (let i = 0; i < 10; i++) {
        paths[`/item-${i}`] = {
          get: { responses: { '200': { description: 'OK' } } }
        };
      }

      const { summary } = getDocumentationInsights(buildDocument({ paths }));

      expect(summary.grade).toBe('F');
    });
  });

  describe('insight ordering', () => {
    it('returns insights sorted by severity: errors first, then warnings, then info', () => {
      const document = buildDocument({
        paths: {
          '/mixed': {
            get: {
              // No summary (error), no description (warning), no tags (warning), has success response
              responses: { '200': { description: 'OK' } }
            }
          }
        },
        components: {
          schemas: {
            SimpleDto: {
              type: 'object' // No description (info)
            }
          }
        }
      });

      const { insights } = getDocumentationInsights(document);
      const severities = insights.map((i) => i.severity);

      const errorIdx = severities.lastIndexOf('error');
      const warningIdx = severities.indexOf('warning');
      const infoIdx = severities.indexOf('info');

      expect(errorIdx).toBeLessThan(warningIdx);
      expect(warningIdx).toBeLessThan(infoIdx);
    });
  });

  describe('multiple HTTP methods on same path', () => {
    it('analyses each HTTP method independently', () => {
      const document = buildDocument({
        paths: {
          '/resources': {
            get: {
              summary: 'List',
              description: 'List all.',
              tags: ['Resources'],
              responses: { '200': { description: 'OK' } }
            },
            post: {
              responses: { '201': { description: 'Created' } }
            }
          }
        }
      });

      const { summary } = getDocumentationInsights(document);

      expect(summary.totalEndpoints).toBe(2);
      expect(summary.documentedEndpoints).toBe(1);
    });
  });
});

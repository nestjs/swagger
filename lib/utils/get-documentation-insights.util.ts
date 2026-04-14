import {
  OpenAPIObject,
  OperationObject,
  SchemaObject
} from '../interfaces/open-api-spec.interface';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace'
] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];

/** Severity of a documentation gap. */
export type InsightSeverity = 'error' | 'warning' | 'info';

/** Machine-readable codes for each type of documentation gap. */
export type InsightCode =
  | 'MISSING_OPERATION_SUMMARY'
  | 'MISSING_OPERATION_DESCRIPTION'
  | 'MISSING_OPERATION_TAGS'
  | 'MISSING_SUCCESS_RESPONSE'
  | 'MISSING_SCHEMA_DESCRIPTION'
  | 'MISSING_PROPERTY_DESCRIPTION'
  | 'DEPRECATED_WITHOUT_DESCRIPTION';

/** A single documentation quality finding. */
export interface DocumentationInsight {
  /** How serious the gap is. */
  severity: InsightSeverity;
  /** Machine-readable gap category. */
  code: InsightCode;
  /** Human-readable location, e.g. `"GET /users"` or `"schema:UserDto.email"`. */
  location: string;
  /** Plain-English explanation of what is missing and why it matters. */
  message: string;
}

/** High-level statistics computed from the OpenAPI document. */
export interface DocumentationHealthSummary {
  /** Composite documentation quality score from 0 to 100. */
  score: number;
  /** Letter grade derived from the score (A=90+, B=80+, C=70+, D=60+, F=<60). */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Total number of operations across all paths. */
  totalEndpoints: number;
  /** Operations that have at least a summary, tags, and a documented success response. */
  documentedEndpoints: number;
  /** Total number of named schemas in `components.schemas`. */
  totalSchemas: number;
  /** Schemas that have a description. */
  documentedSchemas: number;
  /** Total number of schema properties inspected. */
  totalProperties: number;
  /** Properties that have a description. */
  documentedProperties: number;
}

/** Complete documentation health report for an OpenAPI document. */
export interface DocumentationInsights {
  /** Aggregate statistics and overall score. */
  summary: DocumentationHealthSummary;
  /** Ordered list of documentation gaps, most severe first. */
  insights: DocumentationInsight[];
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

/**
 * Analyses an OpenAPI document and returns a structured report of documentation
 * quality — covering operations, schemas, and individual properties.
 *
 * @example
 * ```typescript
 * const document = SwaggerModule.createDocument(app, config);
 * const report = getDocumentationInsights(document);
 * console.log(`API doc score: ${report.summary.score}/100 (${report.summary.grade})`);
 * ```
 */
export function getDocumentationInsights(
  document: OpenAPIObject
): DocumentationInsights {
  const insights: DocumentationInsight[] = [];

  let totalEndpoints = 0;
  let documentedEndpoints = 0;

  const paths = document.paths ?? {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OperationObject | undefined;
      if (!operation) continue;

      totalEndpoints++;
      const location = `${method.toUpperCase()} ${path}`;
      let endpointDocumentationScore = 0;

      if (!operation.summary) {
        insights.push({
          severity: 'error',
          code: 'MISSING_OPERATION_SUMMARY',
          location,
          message: `Operation is missing a summary. Summaries are shown in the endpoint list and are the first thing developers read.`
        });
      } else {
        endpointDocumentationScore++;
      }

      if (!operation.description) {
        insights.push({
          severity: 'warning',
          code: 'MISSING_OPERATION_DESCRIPTION',
          location,
          message: `Operation is missing a description. Descriptions let you explain edge cases, authentication requirements, and rate-limiting behaviour.`
        });
      } else {
        endpointDocumentationScore++;
      }

      if (!operation.tags || operation.tags.length === 0) {
        insights.push({
          severity: 'warning',
          code: 'MISSING_OPERATION_TAGS',
          location,
          message: `Operation has no tags. Tags group endpoints into logical sections in the Swagger UI.`
        });
      } else {
        endpointDocumentationScore++;
      }

      const responses = operation.responses ?? {};
      const hasSuccessResponse = Object.keys(responses).some(
        (code) => Number(code) >= 200 && Number(code) < 300
      );

      if (!hasSuccessResponse) {
        insights.push({
          severity: 'error',
          code: 'MISSING_SUCCESS_RESPONSE',
          location,
          message: `Operation documents no 2xx response. Without a success schema, client code generators produce untyped responses.`
        });
      } else {
        endpointDocumentationScore++;
      }

      if (operation.deprecated && !operation.description) {
        insights.push({
          severity: 'warning',
          code: 'DEPRECATED_WITHOUT_DESCRIPTION',
          location,
          message: `Operation is marked deprecated but has no description explaining the replacement or removal timeline.`
        });
      }

      if (endpointDocumentationScore >= 4) {
        documentedEndpoints++;
      }
    }
  }

  let totalSchemas = 0;
  let documentedSchemas = 0;
  let totalProperties = 0;
  let documentedProperties = 0;

  const schemas = document.components?.schemas ?? {};

  for (const [schemaName, rawSchema] of Object.entries(schemas)) {
    if (!rawSchema || '$ref' in rawSchema) continue;

    const schema = rawSchema as SchemaObject;
    totalSchemas++;

    if (schema.description) {
      documentedSchemas++;
    } else {
      insights.push({
        severity: 'info',
        code: 'MISSING_SCHEMA_DESCRIPTION',
        location: `schema:${schemaName}`,
        message: `Schema "${schemaName}" has no description. A one-liner explaining the domain concept saves hours of guesswork.`
      });
    }

    const properties = schema.properties ?? {};
    for (const [propName, rawProp] of Object.entries(properties)) {
      if (!rawProp || '$ref' in rawProp) continue;

      totalProperties++;
      const prop = rawProp as SchemaObject;

      if (prop.description) {
        documentedProperties++;
      } else {
        insights.push({
          severity: 'info',
          code: 'MISSING_PROPERTY_DESCRIPTION',
          location: `schema:${schemaName}.${propName}`,
          message: `Property "${propName}" on schema "${schemaName}" has no description. Undocumented properties silently break integrations when semantics change.`
        });
      }
    }
  }

  const score = computeScore({
    totalEndpoints,
    documentedEndpoints,
    totalSchemas,
    documentedSchemas,
    totalProperties,
    documentedProperties
  });

  insights.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return {
    summary: {
      score,
      grade: scoreToGrade(score),
      totalEndpoints,
      documentedEndpoints,
      totalSchemas,
      documentedSchemas,
      totalProperties,
      documentedProperties
    },
    insights
  };
}

function computeScore(counts: {
  totalEndpoints: number;
  documentedEndpoints: number;
  totalSchemas: number;
  documentedSchemas: number;
  totalProperties: number;
  documentedProperties: number;
}): number {
  const {
    totalEndpoints,
    documentedEndpoints,
    totalSchemas,
    documentedSchemas,
    totalProperties,
    documentedProperties
  } = counts;

  // Endpoints carry 60% of the weight; schemas 20%; properties 20%.
  const endpointRatio =
    totalEndpoints > 0 ? documentedEndpoints / totalEndpoints : 1;
  const schemaRatio =
    totalSchemas > 0 ? documentedSchemas / totalSchemas : 1;
  const propertyRatio =
    totalProperties > 0 ? documentedProperties / totalProperties : 1;

  const weighted =
    endpointRatio * 0.6 + schemaRatio * 0.2 + propertyRatio * 0.2;

  return Math.round(weighted * 100);
}

function scoreToGrade(
  score: number
): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

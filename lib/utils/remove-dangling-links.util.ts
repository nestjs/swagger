import {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  ResponseObject
} from '../interfaces/open-api-spec.interface.js';

function getOperations(pathItem: PathItemObject): OperationObject[] {
  const operations = Object.values(pathItem ?? {}).filter(
    (value): value is OperationObject =>
      !!value && typeof value === 'object' && 'responses' in value
  );
  return [
    ...operations,
    ...Object.values(pathItem?.additionalOperations ?? {})
  ];
}

/**
 * Removes the response links that point to an operation the document does not
 * contain (e.g. an endpoint excluded from it), as they would publish its
 * operation ID.
 */
export function removeDanglingLinks(document: OpenAPIObject): void {
  const operations = [
    ...Object.values(document.paths ?? {}),
    ...Object.values(document.webhooks ?? {})
  ].flatMap((pathItem) => getOperations(pathItem as PathItemObject));
  const operationIds = new Set(
    operations.map((operation) => operation.operationId)
  );

  for (const operation of operations) {
    for (const response of Object.values(operation.responses ?? {})) {
      const { links } = response as ResponseObject;
      if (!links) {
        continue;
      }
      for (const [name, link] of Object.entries(links)) {
        if (
          'operationId' in link &&
          link.operationId &&
          !operationIds.has(link.operationId)
        ) {
          delete links[name];
        }
      }
      if (Object.keys(links).length === 0) {
        delete (response as ResponseObject).links;
      }
    }
  }
}

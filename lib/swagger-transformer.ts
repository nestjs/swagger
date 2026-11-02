import groupBy from 'es-toolkit/compat/groupBy';
import isEqual from 'es-toolkit/compat/isEqual';
import keyBy from 'es-toolkit/compat/keyBy';
import mapValues from 'es-toolkit/compat/mapValues';
import omit from 'es-toolkit/compat/omit';
import uniqWith from 'es-toolkit/compat/uniqWith';
import { DenormalizedDoc } from './interfaces/denormalized-doc.interface.js';
import { OpenAPIObject } from './interfaces/index.js';
import { sortObjectLexicographically } from './utils/sort-object-lexicographically.js';

type DenormalizedDocWithRoot = DenormalizedDoc & {
  root: NonNullable<DenormalizedDoc['root']>;
};

export class SwaggerTransformer {
  public normalizePaths(denormalizedDoc: DenormalizedDoc[]): Pick<
    OpenAPIObject,
    'paths' | 'webhooks'
  > & {
    webhookPaths?: OpenAPIObject['paths'];
  } {
    const roots = denormalizedDoc.filter(
      (doc): doc is DenormalizedDocWithRoot => Boolean(doc.root)
    );
    const webhookRoots = roots.filter(({ root }) => Boolean(root.isWebhook));
    const pathRoots = roots.filter(({ root }) => !root.isWebhook);
    const groupedByPath = groupBy(pathRoots, ({ root }) => root.path);
    const paths = mapValues(groupedByPath, (routes) =>
      this.normalizeOperations(routes)
    );

    const groupedByWebhookName = groupBy(
      webhookRoots,
      ({ root }) => root.webhookName || root.path
    );
    const webhooks = mapValues(groupedByWebhookName, (routes) =>
      this.normalizeOperations(routes)
    );
    const groupedByWebhookPath = groupBy(webhookRoots, ({ root }) => root.path);
    const webhookPaths = mapValues(groupedByWebhookPath, (routes) =>
      this.normalizeOperations(routes)
    );
    return {
      paths,
      ...(Object.keys(webhooks).length > 0 ? { webhooks } : {}),
      ...(Object.keys(webhookPaths).length > 0 ? { webhookPaths } : {})
    };
  }

  private normalizeOperations(routes: DenormalizedDocWithRoot[]) {
    const keyByMethod = keyBy(routes, ({ root }) => root.method);
    return mapValues(keyByMethod, (route: any) => {
      const mergedDefinition = {
        ...omit(route, 'root'),
        ...omit(route.root, ['method', 'path', 'isWebhook', 'webhookName'])
      };
      // Route patterns that differ only in what an OpenAPI path template cannot
      // express (e.g. ":id(^\\d+)" and ":id", ":path" and "*path") end up with
      // the same path and method, yet only one handler can be described.
      // Keep the security requirements of every handler it stands for.
      const handlers = routes.filter(
        ({ root }) => root.method === route.root.method
      );
      if (handlers.length > 1) {
        const security = uniqWith(
          handlers.flatMap(
            (handler) => handler.root.security ?? handler.security ?? []
          ),
          isEqual
        );
        if (security.length > 0) {
          mergedDefinition.security = security;
        }
      }
      return sortObjectLexicographically(mergedDefinition);
    });
  }
}

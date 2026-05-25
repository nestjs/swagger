import { groupBy, keyBy, mapValues, omit } from 'es-toolkit/compat';
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
    const paths = mapValues(groupedByPath, (routes) => {
      const keyByMethod = keyBy(routes, ({ root }) => root.method);
      return mapValues(keyByMethod, (route: any) => {
        const mergedDefinition = {
          ...omit(route, 'root'),
          ...omit(route.root, ['method', 'path', 'isWebhook', 'webhookName'])
        };
        return sortObjectLexicographically(mergedDefinition);
      });
    });

    const groupedByWebhookName = groupBy(
      webhookRoots,
      ({ root }) => root.webhookName || root.path
    );
    const webhooks = mapValues(groupedByWebhookName, (routes) => {
      const keyByMethod = keyBy(routes, ({ root }) => root.method);
      return mapValues(keyByMethod, (route: any) => {
        const mergedDefinition = {
          ...omit(route, 'root'),
          ...omit(route.root, ['method', 'path', 'isWebhook', 'webhookName'])
        };
        return sortObjectLexicographically(mergedDefinition);
      });
    });
    const groupedByWebhookPath = groupBy(webhookRoots, ({ root }) => root.path);
    const webhookPaths = mapValues(groupedByWebhookPath, (routes) => {
      const keyByMethod = keyBy(routes, ({ root }) => root.method);
      return mapValues(keyByMethod, (route: any) => {
        const mergedDefinition = {
          ...omit(route, 'root'),
          ...omit(route.root, ['method', 'path', 'isWebhook', 'webhookName'])
        };
        return sortObjectLexicographically(mergedDefinition);
      });
    });
    return {
      paths,
      ...(Object.keys(webhooks).length > 0 ? { webhooks } : {}),
      ...(Object.keys(webhookPaths).length > 0 ? { webhookPaths } : {})
    };
  }
}

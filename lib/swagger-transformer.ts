import { filter, groupBy, keyBy, mapValues, omit } from 'lodash';
import { OpenAPIObject } from './interfaces';
import { sortObjectLexicographically } from './utils/sort-object-lexicographically';

export class SwaggerTransformer {
  public normalizePaths(
    denormalizedDoc: (Partial<OpenAPIObject> & Record<'root', any>)[]
  ): Pick<OpenAPIObject, 'paths' | 'webhooks'> & {
    webhookPaths?: OpenAPIObject['paths'];
  } {
    const roots = filter(denormalizedDoc, (r) => r.root);
    const webhookRoots = roots.filter(({ root }: Record<'root', any>) =>
      Boolean(root?.isWebhook)
    );
    const pathRoots = roots.filter(
      ({ root }: Record<'root', any>) => !root?.isWebhook
    );
    const groupedByPath = groupBy(
      pathRoots,
      ({ root }: Record<'root', any>) => root.path
    );
    const paths = mapValues(groupedByPath, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: Record<'root', any>) => root.method
      );
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
      ({ root }: Record<'root', any>) => root.webhookName || root.path
    );
    const webhooks = mapValues(groupedByWebhookName, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: Record<'root', any>) => root.method
      );
      return mapValues(keyByMethod, (route: any) => {
        const mergedDefinition = {
          ...omit(route, 'root'),
          ...omit(route.root, ['method', 'path', 'isWebhook', 'webhookName'])
        };
        return sortObjectLexicographically(mergedDefinition);
      });
    });
    const groupedByWebhookPath = groupBy(
      webhookRoots,
      ({ root }: Record<'root', any>) => root.path
    );
    const webhookPaths = mapValues(groupedByWebhookPath, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: Record<'root', any>) => root.method
      );
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

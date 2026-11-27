import cloneDeep from 'es-toolkit/compat/cloneDeep';
import groupBy from 'es-toolkit/compat/groupBy';
import isEqual from 'es-toolkit/compat/isEqual';
import keyBy from 'es-toolkit/compat/keyBy';
import mapValues from 'es-toolkit/compat/mapValues';
import omit from 'es-toolkit/compat/omit';
import uniqWith from 'es-toolkit/compat/uniqWith';
import { DenormalizedDoc } from './interfaces/denormalized-doc.interface.js';
import {
  OpenAPIObject,
  SecurityRequirementObject
} from './interfaces/index.js';
import { sortObjectLexicographically } from './utils/sort-object-lexicographically.js';

type DenormalizedDocWithRoot = DenormalizedDoc & {
  root: NonNullable<DenormalizedDoc['root']>;
};

export class SwaggerTransformer {
  public normalizePaths(
    denormalizedDoc: DenormalizedDoc[],
    globalSecurity: SecurityRequirementObject[] = []
  ): Pick<OpenAPIObject, 'paths' | 'webhooks'> & {
    webhookPaths?: OpenAPIObject['paths'];
  } {
    const roots = denormalizedDoc.filter(
      (doc): doc is DenormalizedDocWithRoot => Boolean(doc.root)
    );
    const webhookRoots = roots.filter(({ root }) => Boolean(root.isWebhook));
    const pathRoots = roots.filter(({ root }) => !root.isWebhook);
    const groupedByPath = groupBy(pathRoots, ({ root }) => root.path);
    const paths = mapValues(groupedByPath, (routes) =>
      this.normalizeOperations(routes, globalSecurity)
    );

    const webhookNameOf = ({ root }: DenormalizedDocWithRoot) =>
      root.webhookName || root.path;
    const webhooksByName = groupBy(webhookRoots, webhookNameOf);
    // Unnamed webhooks of different handlers may share a method name. Each of
    // them is then keyed by its class and method name, so none is left out.
    const groupedByWebhookName = groupBy(webhookRoots, (doc) => {
      const name = webhookNameOf(doc);
      const { qualifiedWebhookName } = doc.root;
      const isShared =
        qualifiedWebhookName !== undefined &&
        webhooksByName[name].some(
          ({ root }) => root.qualifiedWebhookName !== qualifiedWebhookName
        );
      return isShared ? qualifiedWebhookName : name;
    });
    const webhooks = mapValues(groupedByWebhookName, (routes) =>
      this.normalizeOperations(routes, globalSecurity)
    );
    const groupedByWebhookPath = groupBy(webhookRoots, ({ root }) => root.path);
    const webhookPaths = mapValues(groupedByWebhookPath, (routes) =>
      this.normalizeOperations(routes, globalSecurity)
    );
    return {
      paths,
      ...(Object.keys(webhooks).length > 0 ? { webhooks } : {}),
      ...(Object.keys(webhookPaths).length > 0 ? { webhookPaths } : {})
    };
  }

  private normalizeOperations(
    routes: DenormalizedDocWithRoot[],
    globalSecurity: SecurityRequirementObject[]
  ) {
    const keyByMethod = keyBy(routes, ({ root }) => root.method);
    return mapValues(keyByMethod, (route: any) => {
      const mergedDefinition = {
        ...omit(route, 'root'),
        ...omit(route.root, [
          'method',
          'path',
          'isWebhook',
          'webhookName',
          'qualifiedWebhookName'
        ])
      };
      // Route patterns that differ only in what an OpenAPI path template cannot
      // express (e.g. ":id(^\\d+)" and ":id", ":path" and "*path") end up with
      // the same path and method, yet only one handler can be described.
      // Keep the security requirements of every handler it stands for.
      const handlers = routes.filter(
        ({ root }) => root.method === route.root.method
      );
      // A handler that declares none is covered by the security requirements
      // of the document, which those of an operation replace.
      if (handlers.length > 1) {
        const declared = handlers.map(
          (handler) => handler.root.security ?? handler.security
        );
        if (declared.some((security) => security !== undefined)) {
          const effective = declared.map(
            (security) => security ?? cloneDeep(globalSecurity)
          );
          // Requirements are alternatives, so an empty one ("{}") makes
          // credentials optional for the whole operation. Keep it only if
          // every handler can be called without them.
          const isAnonymous = (requirement: SecurityRequirementObject) =>
            Object.keys(requirement).length === 0;
          const allowsAnonymous = effective.every(
            (security) => security.length === 0 || security.some(isAnonymous)
          );
          const security = uniqWith(effective.flat(), isEqual).filter(
            (requirement) => allowsAnonymous || !isAnonymous(requirement)
          );
          if (security.length > 0) {
            mergedDefinition.security = security;
          }
        }
      }
      return sortObjectLexicographically(mergedDefinition);
    });
  }
}

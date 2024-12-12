import { INestApplication, VersioningType } from '@nestjs/common';
import { filter, groupBy, keyBy, mapValues, omit } from 'lodash';
import { OpenAPIObject } from './interfaces';
import { ModuleRoute } from './interfaces/module-route.interface';
import { sortObjectLexicographically } from './utils/sort-object-lexicographically';

type DenormalizedDoc = Partial<OpenAPIObject> & Record<'root', any>;

export class SwaggerTransformer {
  private hasRootKey(r: DenormalizedDoc): boolean {
    return !!r.root;
  }

  private hasRootKeyWithVersions(includeVersions: string[]) {
    return ({ root }: DenormalizedDoc) =>
      root &&
      // Versions is null if route lacks any version and no default version is set
      // Versions array is empty when route is VERSION_NEUTRAL
      // In both cases we want to include the route
      (!root.versions?.length ||
        // Else only include if route has matching version
        (root.versionType === VersioningType.HEADER &&
          root.versions.some((v) => includeVersions.includes(v))) ||
        (root.versionType === VersioningType.URI &&
          includeVersions.some((v) => root.path.includes(`/${v}/`))));
  }

  private getVersionedPath(includeVersions?: string[]) {
    return ({ root }: DenormalizedDoc) => {
      if (
        // URI-based versioning already results in unique paths
        root.versionType !== VersioningType.URI &&
        // Versions array is empty when route is VERSION_NEUTRAL
        root.versions?.length &&
        // If we're not filtering down to a single version make the versions part of the path
        (!includeVersions || includeVersions?.length > 1)
      ) {
        return `${root.path} version${
          root.versions.length > 1 ? 's' : ''
        }: ${root.versions.join(', ')}`;
      }
      return root.path;
    };
  }

  public normalizePaths(
    denormalizedDoc: DenormalizedDoc[],
    includeVersions?: string[]
  ): Record<'paths', OpenAPIObject['paths']> {
    const roots = filter(
      denormalizedDoc,
      includeVersions
        ? this.hasRootKeyWithVersions(includeVersions)
        : this.hasRootKey
    );
    const groupedByPath = groupBy(
      roots,
      this.getVersionedPath(includeVersions)
    );
    const paths = mapValues(groupedByPath, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: Record<'root', any>) => root.method
      );
      return mapValues(keyByMethod, (route: any) => {
        const mergedDefinition = {
          ...omit(route, 'root'),
          ...omit(route.root, ['method', 'path', 'versions', 'versionType'])
        };
        return sortObjectLexicographically(mergedDefinition);
      });
    });
    return {
      paths
    };
  }

  public unescapeColonsInPath(
    app: INestApplication,
    moduleRoutes: ModuleRoute[]
  ): ModuleRoute[] {
    const httpAdapter = app.getHttpAdapter();
    const usingFastify = httpAdapter && httpAdapter.getType() === 'fastify';
    const unescapeColon = usingFastify
      ? (path: string) => path.replace(/:\{([^}]+)\}/g, ':$1')
      : (path: string) => path.replace(/\[:\]/g, ':');

    return moduleRoutes.map((moduleRoute) => ({
      ...moduleRoute,
      root: {
        ...moduleRoute.root,
        path: unescapeColon(moduleRoute.root.path)
      }
    }));
  }
}

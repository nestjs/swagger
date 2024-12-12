import {
  INestApplication,
  VERSION_NEUTRAL,
  VersioningType
} from '@nestjs/common';
import { filter, groupBy, keyBy, mapValues, omit } from 'lodash';
import { OpenAPIObject } from './interfaces';
import { ModuleRoute } from './interfaces/module-route.interface';
import { sortObjectLexicographically } from './utils/sort-object-lexicographically';

type DenormalizedDoc = Partial<OpenAPIObject> & Record<'root', any>;

export class SwaggerTransformer {
  private getVersionedPath({ root }: DenormalizedDoc) {
    // URI-based versioning already results in unique paths
    if (
      root.versionType !== VersioningType.URI &&
      // Versions array is empty when route is VERSION_NEUTRAL
      root.versions?.length
    ) {
      return `${root.path} version${
        root.versions.length > 1 ? 's' : ''
      }: ${root.versions.join(', ')}`;
    }
    return root.path;
  }

  public normalizePaths(
    denormalizedDoc: DenormalizedDoc[]
  ): Record<'paths', OpenAPIObject['paths']> {
    const roots = filter(denormalizedDoc, (r) => r.root);
    const groupedByPath = groupBy(roots, this.getVersionedPath);
    const paths = mapValues(groupedByPath, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: DenormalizedDoc) => root.method
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

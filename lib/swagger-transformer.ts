import { filter, groupBy, keyBy, mapValues, omit } from 'lodash';
import { OpenAPIObject } from './interfaces';

export class SwaggerTransformer {
  public normalizePaths(
    denormalizedDoc: (Partial<OpenAPIObject> & Record<'root', any>)[]
  ): Record<'paths', OpenAPIObject['paths']> {
    const roots = filter(denormalizedDoc, (r) => r.root);
    const groupedByPath = groupBy(
      roots,
      ({ root }: Record<'root', any>) => root.path
    );
    const paths = mapValues(groupedByPath, (routes) => {
      const keyByMethod = keyBy(
        routes,
        ({ root }: Record<'root', any>) => root.method
      );
      return mapValues(keyByMethod, (route: any) => {
        return {
          ...omit(route.root, ['method', 'path']),
          ...omit(route, 'root')
        };
      });
    });
    return {
      paths
    };
  }
}

import { groupBy, keyBy, filter, mapValues, omit } from 'lodash';

export class SwaggerTransformer {
    public normalizePaths(denormalizedDoc) {
        const doc = filter(denormalizedDoc, (r) => r.root);
        const groupedByPath = groupBy(doc, ({ root }) => root.path);
        const paths = mapValues(groupedByPath, (routes) => {
            const keyByMethod = keyBy(routes, ({ root }) => root.method);
            return mapValues(keyByMethod, (route: any) => {
                return {
                    ...omit(route.root, ['method', 'path']),
                    ...omit(route, 'root'),
                };
            });
        });
        return {
            paths,
        };
    }
}
import * as _ from 'lodash';
import { groupBy, keyBy, mapValues, omit } from 'lodash';

export class SwaggerTransformer {
    public normalizePaths(denormalizedDoc) {
        const groupedByPath = _(denormalizedDoc)
          .filter(r => r.root)
          .groupBy(({ root }) => root.path)
          .value();

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

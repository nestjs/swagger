"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class SwaggerTransformer {
    normalizePaths(denormalizedDoc) {
        const doc = lodash_1.filter(denormalizedDoc, r => r.root);
        const groupedByPath = lodash_1.groupBy(doc, ({ root }) => root.path);
        const paths = lodash_1.mapValues(groupedByPath, routes => {
            const keyByMethod = lodash_1.keyBy(routes, ({ root }) => root.method);
            return lodash_1.mapValues(keyByMethod, (route) => {
                return Object.assign({}, lodash_1.omit(route.root, ['method', 'path']), lodash_1.omit(route, 'root'));
            });
        });
        return {
            paths,
        };
    }
}
exports.SwaggerTransformer = SwaggerTransformer;

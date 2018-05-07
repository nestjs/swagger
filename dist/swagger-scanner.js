"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_explorer_1 = require("./swagger-explorer");
const lodash_1 = require("lodash");
const swagger_transformer_1 = require("./swagger-transformer");
class SwaggerScanner {
    constructor() {
        this.explorer = new swagger_explorer_1.SwaggerExplorer();
        this.transfomer = new swagger_transformer_1.SwaggerTransformer();
    }
    scanApplication(app) {
        const { container } = app;
        const modules = container.getModules();
        const denormalizedPaths = [...modules.values()].map(({ routes }) => this.scanModuleRoutes(routes));
        return Object.assign({}, this.transfomer.normalizePaths(lodash_1.flatten(denormalizedPaths)), { definitions: lodash_1.reduce(this.explorer.getModelsDefinitons(), lodash_1.extend) });
    }
    scanModuleRoutes(routes) {
        const denormalizedArray = [...routes.values()].map(ctrl => this.explorer.exploreController(ctrl));
        return lodash_1.flatten(denormalizedArray);
    }
}
exports.SwaggerScanner = SwaggerScanner;

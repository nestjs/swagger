import { SwaggerDocument } from './interfaces';
import { SwaggerExplorer } from './swagger-explorer';
import { flatten, groupBy, keyBy, mapValues, omit, reduce, extend } from 'lodash';
import { SwaggerTransformer } from './swagger-transformer';

export class SwaggerScanner {
    private readonly explorer = new SwaggerExplorer();
    private readonly transfomer = new SwaggerTransformer();

    public scanApplication(app): SwaggerDocument {
        const { container } = app;
        const modules = container.getModules();

        const denormalizedPaths = [...modules.values()].map(({ routes }) => this.scanModuleRoutes(routes));
        return {
            ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
            definitions: reduce(this.explorer.getModelsDefinitons(), extend),
        };
    }

    public scanModuleRoutes(routes): SwaggerDocument {
        const denormalizedArray = [...routes.values()].map((ctrl) => this.explorer.exploreController(ctrl));
        return flatten(denormalizedArray) as any;
    }
}

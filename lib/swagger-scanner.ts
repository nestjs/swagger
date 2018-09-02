import { MODULE_PATH } from '@nestjs/common/constants';
import { extend, flatten, isEmpty, map, reduce } from 'lodash';
import { SwaggerDocument } from './interfaces';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';

export class SwaggerScanner {
  private readonly explorer = new SwaggerExplorer();
  private readonly transfomer = new SwaggerTransformer();

  public scanApplication(app, includedModules?: Function[]): SwaggerDocument {
    const { container } = app;
    const modules = this.getModules(container.getModules(), includedModules);
    const denormalizedPaths = map(modules, ({ routes, metatype }) => {
      // Note: nest-router
      // Get the module path (if any), to prefix it for all the module controllers.
      const path = metatype
        ? Reflect.getMetadata(MODULE_PATH, metatype)
        : undefined;
      return this.scanModuleRoutes(routes, path);
    });
    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
      definitions: reduce(this.explorer.getModelsDefinitons(), extend)
    };
  }

  public scanModuleRoutes(routes, modulePath): SwaggerDocument {
    const denormalizedArray = [...routes.values()].map(ctrl =>
      this.explorer.exploreController(ctrl, modulePath)
    );
    return flatten(denormalizedArray) as any;
  }

  public getModules(
    modulesContainer: Map<any, any>,
    include: Function[]
  ): any[] {
    if (!include || isEmpty(include)) {
      return [...modulesContainer.values()];
    }
    return [...modulesContainer.values()].filter(({ metatype }) =>
      include.some(item => item === metatype)
    );
  }
}

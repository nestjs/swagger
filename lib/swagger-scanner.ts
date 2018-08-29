import { extend, flatten, reduce, filter, map } from 'lodash';
import { SwaggerDocument } from './interfaces';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';
import { MODULE_PATH } from '@nestjs/common/constants';

export class SwaggerScanner {
  private readonly explorer = new SwaggerExplorer();
  private readonly transfomer = new SwaggerTransformer();

  public scanApplication(app, includedModules): SwaggerDocument {
    const { container } = app;
    const modules = container.getModules();
    const denormalizedPaths = map(
      filter(
        [...modules.values()],
        ({ metatype }) =>
          !(
            includedModules.length > 0 &&
            metatype &&
            !includedModules.includes(metatype)
          )
      ),
      ({ routes, metatype }) => {
        // get the module path (if any), to prefix it for all the module controllers.
        const path = metatype
          ? Reflect.getMetadata(MODULE_PATH, metatype)
          : undefined;
        return this.scanModuleRoutes(routes, path);
      }
    );
    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
      definitions: reduce(this.explorer.getModelsDefinitons(), extend)
    };
  }

  public scanModuleRoutes(routes, modulePath): SwaggerDocument {
    const denormalizedArray = [...routes.values()].map(ctrl => {
      return this.explorer.exploreController(ctrl, modulePath);
    });
    return flatten(denormalizedArray) as any;
  }
}

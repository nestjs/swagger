import { MODULE_PATH } from "@nestjs/common/constants";

import { SwaggerDocument } from "./interfaces";
import { SwaggerExplorer } from "./swagger-explorer";
import {
  flatten,
  groupBy,
  keyBy,
  mapValues,
  omit,
  reduce,
  extend
} from "lodash";
import { SwaggerTransformer } from "./swagger-transformer";

export class SwaggerScanner {
  private readonly explorer = new SwaggerExplorer();
  private readonly transfomer = new SwaggerTransformer();

  public scanApplication(app): SwaggerDocument {
    const { container } = app;
    const modules = container.getModules();

    const denormalizedPaths = [...modules.values()].map(
      ({ routes, metatype }) => {
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
    const denormalizedArray = [...routes.values()].map(ctrl =>
      this.explorer.exploreController(ctrl, modulePath)
    );
    return flatten(denormalizedArray) as any;
  }
}

import { SwaggerDocument } from './interfaces';
import { SwaggerExplorer } from './swagger-explorer';
import {
  flatten,
  groupBy,
  keyBy,
  mapValues,
  omit,
  reduce,
  extend
} from 'lodash';
import { SwaggerTransformer } from './swagger-transformer';
import { Logger } from '@nestjs/common';
import * as util from 'util';

export class SwaggerScanner {
  private readonly explorer = new SwaggerExplorer();
  private readonly transfomer = new SwaggerTransformer();

  public scanApplication(app): SwaggerDocument {
    const { container } = app;
    const modules = container.getModules();

    const denormalizedPaths = [...modules.values()].map(({ routes }) =>
      this.scanModuleRoutes(routes)
    );

    const resb = this.transfomer.normalizePaths(flatten(denormalizedPaths));
    const res = {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
      definitions: reduce(this.explorer.getModelsDefinitons(), extend)
    };
    console.log(util.inspect(res.paths, false, null));
    return res;
  }

  public scanModuleRoutes(routes): SwaggerDocument {
    const denormalizedArray = [...routes.values()].map(ctrl =>
      this.explorer.exploreController(ctrl)
    );
    return flatten(denormalizedArray) as any;
  }
}

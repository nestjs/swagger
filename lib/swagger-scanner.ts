import { INestApplication, Type } from '@nestjs/common';
import { MODULE_PATH } from '@nestjs/common/constants';
import { NestContainer } from '@nestjs/core/injector/container';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { extend, flatten, isEmpty, reduce } from 'lodash';
import { OpenAPIObject } from './interfaces';
import {
  ReferenceObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';

export class SwaggerScanner {
  private readonly explorer = new SwaggerExplorer();
  private readonly transfomer = new SwaggerTransformer();

  public scanApplication(
    app: INestApplication,
    includedModules: Function[],
    deepScanRoutes?: boolean
  ): Omit<OpenAPIObject, 'openapi' | 'info'> {
    const container: NestContainer = (app as any).container;
    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const denormalizedPaths = modules.map(
      ({ routes, metatype, relatedModules }) => {
        let allRoutes = new Map(routes);

        if (deepScanRoutes) {
          // only load submodules routes if asked
          const isGlobal = (module: Type<any>) =>
            !container.isGlobalModule(module);

          Array.from(relatedModules.values())
            .filter(isGlobal as any)
            .map(({ routes: relatedModuleRoutes }) => relatedModuleRoutes)
            .forEach(relatedModuleRoutes => {
              allRoutes = new Map([...allRoutes, ...relatedModuleRoutes]);
            });
        }
        const path = metatype
          ? Reflect.getMetadata(MODULE_PATH, metatype)
          : undefined;

        return this.scanModuleRoutes(allRoutes, path);
      }
    );
    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths) as (Partial<
        OpenAPIObject
      > &
        Record<'root', any>)[]),
      components: {
        schemas: reduce(this.explorer.getSchemas(), extend) as Record<
          string,
          SchemaObject | ReferenceObject
        >
      }
    };
  }

  public scanModuleRoutes(
    routes: Map<string, InstanceWrapper>,
    modulePath?: string
  ): Omit<OpenAPIObject, 'openapi' | 'info'> {
    const denormalizedArray = [...routes.values()].map(ctrl =>
      this.explorer.exploreController(ctrl, modulePath)
    );
    return flatten(denormalizedArray) as any;
  }

  public getModules(
    modulesContainer: Map<string, Module>,
    include: Function[]
  ): Module[] {
    if (!include || isEmpty(include)) {
      return [...modulesContainer.values()];
    }
    return [...modulesContainer.values()].filter(({ metatype }) =>
      include.some(item => item === metatype)
    );
  }
}

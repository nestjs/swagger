import { INestApplication, Type } from '@nestjs/common';
import { MODULE_PATH } from '@nestjs/common/constants';
import { NestContainer } from '@nestjs/core/injector/container';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { extend, flatten, reduce } from 'lodash';
import { OpenAPIObject, SwaggerDocumentOptions } from './interfaces';
import {
  ReferenceObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from './services/model-properties-accessor';
import { SchemaObjectFactory } from './services/schema-object-factory';
import { SwaggerTypesMapper } from './services/swagger-types-mapper';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';
import { stripLastSlash } from './utils/strip-last-slash.util';

export class SwaggerScanner {
  private readonly transfomer = new SwaggerTransformer();
  private readonly schemaObjectFactory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  private readonly explorer = new SwaggerExplorer(this.schemaObjectFactory);

  public scanApplication(
    app: INestApplication,
    options: SwaggerDocumentOptions
  ): Omit<OpenAPIObject, 'openapi' | 'info'> {
    const {
      deepScanRoutes,
      include: includedModules = [],
      exclude: excludedModules = [],
      extraModels = [],
      ignoreGlobalPrefix = false,
      operationIdFactory
    } = options;

    const container: NestContainer = (app as any).container;
    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules,
      excludedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(this.getGlobalPrefix(app))
      : '';

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
            .forEach((relatedModuleRoutes) => {
              allRoutes = new Map([...allRoutes, ...relatedModuleRoutes]);
            });
        }
        const path = metatype
          ? Reflect.getMetadata(MODULE_PATH, metatype)
          : undefined;

        return this.scanModuleRoutes(
          allRoutes,
          path,
          globalPrefix,
          operationIdFactory
        );
      }
    );

    const schemas = this.explorer.getSchemas();
    this.addExtraModels(schemas, extraModels);

    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
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
    modulePath?: string,
    globalPrefix?: string,
    operationIdFactory?: (controllerKey: string, methodKey: string) => string
  ): Array<Omit<OpenAPIObject, 'openapi' | 'info'> & Record<'root', any>> {
    const denormalizedArray = [...routes.values()].map((ctrl) =>
      this.explorer.exploreController(
        ctrl,
        modulePath,
        globalPrefix,
        operationIdFactory
      )
    );
    return flatten(denormalizedArray) as any;
  }

  public getModules(
    modulesContainer: Map<string, Module>,
    include: readonly Function[],
    exclude: readonly Function[]
  ): Module[] {
    const modules = [...modulesContainer.values()];
    if (include.length === 0 && exclude.length === 0) {
      return modules;
    }

    if (include.length && exclude.length) {
      throw new Error('Cannot specify both include and exclude together');
    }

    const isInclude = include.length > 0;
    const set = new Set(isInclude ? include : exclude);

    return modules.filter(({ metatype }) => set.has(metatype) === isInclude);
  }

  public addExtraModels(schemas: SchemaObject[], extraModels: Function[]) {
    extraModels.forEach((item) => {
      this.schemaObjectFactory.exploreModelSchema(item, schemas);
    });
  }

  private getGlobalPrefix(app: INestApplication): string {
    const internalConfigRef = (app as any).config;
    return (internalConfigRef && internalConfigRef.getGlobalPrefix()) || '';
  }
}

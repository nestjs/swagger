import { INestApplication, InjectionToken, Type } from '@nestjs/common';
import { MODULE_PATH } from '@nestjs/common/constants';
import { ApplicationConfig, NestContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { flatten, isEmpty } from 'lodash';
import {
  OpenAPIObject,
  OperationIdFactory,
  SwaggerDocumentOptions
} from './interfaces';
import { ModuleRoute } from './interfaces/module-route.interface';
import {
  ReferenceObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from './services/model-properties-accessor';
import { SchemaObjectFactory } from './services/schema-object-factory';
import { SwaggerTypesMapper } from './services/swagger-types-mapper';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { stripLastSlash } from './utils/strip-last-slash.util';

export class SwaggerScanner {
  private readonly transformer = new SwaggerTransformer();
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
      extraModels = [],
      ignoreGlobalPrefix = false,
      operationIdFactory,
      linkNameFactory,
      autoTagControllers = true,
      recursiveModuleScan = false,
      maxScanDepth = Infinity
    } = options;

    const container = (app as any).container as NestContainer;
    const internalConfigRef = (app as any).config as ApplicationConfig;

    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(getGlobalPrefix(app))
      : '';

    const processedModules = new Set<string>();

    const denormalizedPaths = modules.map(
      ({ controllers, metatype, imports }) => {
        let result: ModuleRoute[] = [];

        if (deepScanRoutes) {
          if (!recursiveModuleScan) {
            // Only load submodules routes if explicitly enabled
            const isGlobal = (module: Type<any>) =>
              !container.isGlobalModule(module);

            Array.from(imports.values())
              .filter(isGlobal as any)
              .forEach(({ metatype, controllers }) => {
                const modulePath = this.getModulePathMetadata(
                  container,
                  metatype
                );
                result = result.concat(
                  this.scanModuleControllers(
                    controllers,
                    modulePath,
                    globalPrefix,
                    internalConfigRef,
                    operationIdFactory,
                    linkNameFactory,
                    autoTagControllers
                  )
                );
              });
          } else {
            result = result.concat(
              this.scanModuleImportsRecursively(
                imports,
                container,
                0,
                maxScanDepth,
                processedModules,
                {
                  globalPrefix,
                  internalConfigRef,
                  operationIdFactory,
                  linkNameFactory,
                  autoTagControllers,
                }
              )
            );
          }
        }
        const modulePath = this.getModulePathMetadata(container, metatype);
        result = result.concat(
          this.scanModuleControllers(
            controllers,
            modulePath,
            globalPrefix,
            internalConfigRef,
            operationIdFactory,
            linkNameFactory,
            autoTagControllers
          )
        );
        return this.transformer.unescapeColonsInPath(app, result);
      }
    );

    const schemas = this.explorer.getSchemas();
    this.addExtraModels(schemas, extraModels);

    return {
      ...this.transformer.normalizePaths(flatten(denormalizedPaths)),
      components: {
        schemas: schemas as Record<string, SchemaObject | ReferenceObject>
      }
    };
  }

  public scanModuleControllers(
    controller: Map<InjectionToken, InstanceWrapper>,
    modulePath: string | undefined,
    globalPrefix: string | undefined,
    applicationConfig: ApplicationConfig,
    operationIdFactory?: OperationIdFactory,
    linkNameFactory?: (
      controllerKey: string,
      methodKey: string,
      fieldKey: string
    ) => string,
    autoTagControllers?: boolean
  ): ModuleRoute[] {
    const denormalizedArray = [...controller.values()].map((ctrl) =>
      this.explorer.exploreController(
        ctrl,
        applicationConfig,
        modulePath,
        globalPrefix,
        operationIdFactory,
        linkNameFactory,
        autoTagControllers
      )
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
      include.some((item) => item === metatype)
    );
  }

  public addExtraModels(
    schemas: Record<string, SchemaObject>,
    extraModels: Function[]
  ) {
    extraModels.forEach((item) => {
      this.schemaObjectFactory.exploreModelSchema(item, schemas);
    });
  }

  private getModulePathMetadata(
    container: NestContainer,
    metatype: Type<unknown>
  ): string | undefined {
    const modulesContainer = container.getModules();
    const modulePath = Reflect.getMetadata(
      MODULE_PATH + modulesContainer.applicationId,
      metatype
    );
    return modulePath ?? Reflect.getMetadata(MODULE_PATH, metatype);
  }

  private scanModuleImportsRecursively(
    imports: Set<Module>,
    container: NestContainer,
    currentDepth: number,
    maxDepth: number | undefined,
    processedModules: Set<string>,
    options: {
      globalPrefix: string;
      internalConfigRef: ApplicationConfig;
      operationIdFactory?: OperationIdFactory;
      linkNameFactory?: (
        controllerKey: string,
        methodKey: string,
        fieldKey: string
      ) => string;
      autoTagControllers?: boolean;
    }
  ): ModuleRoute[] {
    let result: ModuleRoute[] = [];

    for (const { metatype, controllers, imports: subImports } of imports.values()) {
      // Skip if module has already been processed
      const moduleId = this.getModuleId(metatype);
      if (processedModules.has(moduleId) || container.isGlobalModule(metatype) || (maxDepth !== undefined && currentDepth > maxDepth)) {
        continue;
      }
      processedModules.add(moduleId);

      // Scan current module's controllers
      const modulePath = this.getModulePathMetadata(container, metatype);
      result = result.concat(
        this.scanModuleControllers(
          controllers,
          modulePath,
          options.globalPrefix,
          options.internalConfigRef,
          options.operationIdFactory,
          options.linkNameFactory,
          options.autoTagControllers
        )
      );

      // Process sub-imports if any
      if (subImports.size > 0) {
        const nextDepth = currentDepth + 1;
        if (maxDepth === undefined || nextDepth < maxDepth) {
          result = result.concat(
            this.scanModuleImportsRecursively(
              subImports,
              container,
              nextDepth,
              maxDepth,
              processedModules,
              options
            )
          );
        }
      }
    }

    return result;
  }

  private getModuleId(metatype: Type<any>): string {
    return metatype.name || Math.random().toString(36).substring(2);
  }
}

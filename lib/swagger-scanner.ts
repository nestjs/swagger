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
  private explorer: SwaggerExplorer | undefined;

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
      autoTagControllers = true
    } = options;

    const untypedApp = app as any;
    const container = untypedApp.container as NestContainer;
    const internalConfigRef = untypedApp.config as ApplicationConfig;
    const httpAdapterType = app.getHttpAdapter().getType();
    this.initializeSwaggerExplorer(httpAdapterType);

    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(getGlobalPrefix(app))
      : '';

    const denormalizedPaths = modules.map(
      ({ controllers, metatype, imports }) => {
        let result: ModuleRoute[] = [];

        if (deepScanRoutes) {
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
                this.scanModuleControllers(controllers, internalConfigRef, {
                  modulePath,
                  globalPrefix,
                  operationIdFactory,
                  linkNameFactory,
                  autoTagControllers
                })
              );
            });
        }
        const modulePath = this.getModulePathMetadata(container, metatype);
        return result.concat(
          this.scanModuleControllers(controllers, internalConfigRef, {
            modulePath,
            globalPrefix,
            operationIdFactory,
            linkNameFactory,
            autoTagControllers
          })
        );
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
    applicationConfig: ApplicationConfig,
    options: {
      modulePath: string | undefined;
      globalPrefix: string | undefined;
      operationIdFactory?: OperationIdFactory;
      linkNameFactory?: (
        controllerKey: string,
        methodKey: string,
        fieldKey: string
      ) => string;
      autoTagControllers?: boolean;
    }
  ): ModuleRoute[] {
    const denormalizedArray = [...controller.values()].map((ctrl) =>
      this.explorer.exploreController(ctrl, applicationConfig, options)
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

  private initializeSwaggerExplorer(httpAdapterType: string) {
    if (this.explorer) {
      return;
    }
    this.explorer = new SwaggerExplorer(this.schemaObjectFactory, {
      httpAdapterType
    });
  }
}

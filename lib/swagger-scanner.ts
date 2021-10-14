import { INestApplication, Type } from '@nestjs/common';
import { MODULE_PATH } from '@nestjs/common/constants';
import { ApplicationConfig } from '@nestjs/core';
import { NestContainer } from '@nestjs/core/injector/container';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { InstanceToken, Module } from '@nestjs/core/injector/module';
import { flatten, isEmpty } from 'lodash';
import { ApiResponseOptions } from './decorators/';
import { OpenAPIObject, SwaggerDocumentOptions } from './interfaces';
import {
  ReferenceObject,
  ResponsesObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { ModelPropertiesAccessor } from './services/model-properties-accessor';
import { SchemaObjectFactory } from './services/schema-object-factory';
import { SwaggerTypesMapper } from './services/swagger-types-mapper';
import { SwaggerExplorer } from './swagger-explorer';
import { SwaggerTransformer } from './swagger-transformer';
import { mapResponsesToSwaggerResponses } from './utils/map-responses-to-swagger-responses.util';
import { getGlobalPrefix } from './utils/get-global-prefix';
import { stripLastSlash } from './utils/strip-last-slash.util';
import { transformResponsesToRefs } from './utils/transform-responses-to-refs.util';

export class SwaggerScanner {
  private readonly transfomer = new SwaggerTransformer();
  private readonly schemaObjectFactory = new SchemaObjectFactory(
    new ModelPropertiesAccessor(),
    new SwaggerTypesMapper()
  );
  private readonly explorer = new SwaggerExplorer(this.schemaObjectFactory);

  public scanApplication(
    app: INestApplication,
    options: SwaggerDocumentOptions,
    config: Omit<OpenAPIObject, 'paths'>
  ): Omit<OpenAPIObject, 'openapi' | 'info'> {
    const {
      deepScanRoutes,
      include: includedModules = [],
      extraModels = [],
      ignoreGlobalPrefix = false,
      operationIdFactory
    } = options;
    const schemas = this.explorer.getSchemas();

    const container = (app as any).container as NestContainer;
    const internalConfigRef = (app as any).config as ApplicationConfig;

    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(getGlobalPrefix(app))
      : '';
    const globalResponses = mapResponsesToSwaggerResponses(
      config.components.responses as Record<string, ApiResponseOptions>,
      schemas
    );

    const denormalizedPaths = modules.map(
      ({ routes, metatype, relatedModules }) => {
        let result = [];

        if (deepScanRoutes) {
          // only load submodules routes if asked
          const isGlobal = (module: Type<any>) =>
            !container.isGlobalModule(module);

          Array.from(relatedModules.values())
            .filter(isGlobal as any)
            .forEach(({ metatype, routes }) => {
              const modulePath = this.getModulePathMetadata(
                container,
                metatype
              );
              result = result.concat(
                this.scanModuleRoutes(
                  routes,
                  modulePath,
                  globalPrefix,
                  internalConfigRef,
                  transformResponsesToRefs(globalResponses),
                  operationIdFactory
                )
              );
            });
        }
        const modulePath = this.getModulePathMetadata(container, metatype);
        return result.concat(
          this.scanModuleRoutes(
            routes,
            modulePath,
            globalPrefix,
            internalConfigRef,
            transformResponsesToRefs(globalResponses),
            operationIdFactory
          )
        );
      }
    );

    this.addExtraModels(schemas, extraModels);

    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
      components: {
        responses: globalResponses as ResponsesObject,
        schemas: schemas as Record<string, SchemaObject | ReferenceObject>
      }
    };
  }

  public scanModuleRoutes(
    routes: Map<InstanceToken, InstanceWrapper>,
    modulePath: string | undefined,
    globalPrefix: string | undefined,
    applicationConfig: ApplicationConfig,
    globalResponses?: ResponsesObject,
    operationIdFactory?: (controllerKey: string, methodKey: string) => string
  ): Array<Omit<OpenAPIObject, 'openapi' | 'info'> & Record<'root', any>> {
    const denormalizedArray = [...routes.values()].map((ctrl) =>
      this.explorer.exploreController(
        ctrl,
        applicationConfig,
        modulePath,
        globalPrefix,
        globalResponses,
        operationIdFactory
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
}

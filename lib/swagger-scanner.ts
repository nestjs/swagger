import { INestApplication, Type } from '@nestjs/common';
import { MODULE_PATH } from '@nestjs/common/constants';
import { NestContainer } from '@nestjs/core/injector/container';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { extend, flatten, isEmpty, mapValues, reduce } from 'lodash';
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

    const container: NestContainer = (app as any).container;
    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(this.getGlobalPrefix(app))
      : '';
    const globalResponses = mapResponsesToSwaggerResponses(
      config.components.responses as Record<string, ApiResponseOptions>,
      schemas
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
          transformResponsesToRefs(globalResponses),
          operationIdFactory
        );
      }
    );

    this.addExtraModels(schemas, extraModels);

    return {
      ...this.transfomer.normalizePaths(flatten(denormalizedPaths)),
      components: {
        responses: globalResponses as ResponsesObject,
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
    globalResponses?: ResponsesObject,
    operationIdFactory?: (controllerKey: string, methodKey: string) => string
  ): Array<Omit<OpenAPIObject, 'openapi' | 'info'> & Record<'root', any>> {
    const denormalizedArray = [...routes.values()].map((ctrl) =>
      this.explorer.exploreController(
        ctrl,
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

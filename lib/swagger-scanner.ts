import {
  DynamicModule,
  ForwardReference,
  INestApplication,
  InjectionToken,
  Type
} from '@nestjs/common';
import { MODULE_METADATA, MODULE_PATH } from '@nestjs/common/constants.js';
import { ApplicationConfig, NestContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper.js';
import { Module } from '@nestjs/core/injector/module.js';
import { flatten, isEmpty } from 'es-toolkit/compat';
import {
  OpenAPIObject,
  OperationIdFactory,
  SwaggerDocumentOptions
} from './interfaces/index.js';
import { ModuleRoute } from './interfaces/module-route.interface.js';
import {
  ReferenceObject,
  SchemaObject
} from './interfaces/open-api-spec.interface.js';
import { ModelPropertiesAccessor } from './services/model-properties-accessor.js';
import { SchemaObjectFactory } from './services/schema-object-factory.js';
import { SwaggerTypesMapper } from './services/swagger-types-mapper.js';
import { SwaggerExplorer } from './swagger-explorer.js';
import { SwaggerTransformer } from './swagger-transformer.js';
import { applyExampleMaxDepth } from './utils/apply-example-max-depth.util.js';
import { getGlobalPrefix } from './utils/get-global-prefix.js';
import { stripDynamicDefaults } from './utils/strip-dynamic-defaults.util.js';
import { stripLastSlash } from './utils/strip-last-slash.util.js';

export class SwaggerScanner {
  private readonly transformer = new SwaggerTransformer();
  private readonly modelPropertiesAccessor = new ModelPropertiesAccessor();
  private readonly swaggerTypesMapper = new SwaggerTypesMapper();
  private schemaObjectFactory = new SchemaObjectFactory(
    this.modelPropertiesAccessor,
    this.swaggerTypesMapper
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
      autoTagControllers = true,
      onlyIncludeDecoratedEndpoints = false,
      excludeDynamicDefaults = false,
      exampleMaxDepth,
      standardSchemaConverter
    } = options;

    this.schemaObjectFactory = new SchemaObjectFactory(
      this.modelPropertiesAccessor,
      this.swaggerTypesMapper,
      standardSchemaConverter
    );

    const untypedApp = app as any;
    const container = untypedApp.container as NestContainer;
    const internalConfigRef = untypedApp.config as ApplicationConfig;
    const httpAdapterType = app.getHttpAdapter().getType();
    this.initializeSwaggerExplorer(httpAdapterType, standardSchemaConverter);

    const modules: Module[] = this.getModules(
      container.getModules(),
      includedModules
    );
    const globalPrefix = !ignoreGlobalPrefix
      ? stripLastSlash(getGlobalPrefix(app))
      : '';

    const denormalizedPaths = modules.map((module) => {
      const { controllers, metatype, imports } = module;
      let result: ModuleRoute[] = [];

      if (deepScanRoutes) {
        // Only load submodules routes if explicitly enabled
        const explicitGlobalTokens =
          this.getExplicitlyImportedGlobalModuleTokens(container, module);

        Array.from(imports.values())
          .filter(
            (importedModule) =>
              !importedModule.isGlobal ||
              explicitGlobalTokens === undefined ||
              explicitGlobalTokens.has(importedModule.token)
          )
          .forEach(({ metatype, controllers }) => {
            const modulePath = this.getModulePathMetadata(container, metatype);
            result = result.concat(
              this.scanModuleControllers(controllers, internalConfigRef, {
                modulePath,
                globalPrefix,
                operationIdFactory,
                linkNameFactory,
                autoTagControllers,
                onlyIncludeDecoratedEndpoints
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
          autoTagControllers,
          onlyIncludeDecoratedEndpoints
        })
      );
    });

    const schemas = this.explorer.getSchemas();
    this.addExtraModels(schemas, extraModels);

    if (excludeDynamicDefaults) {
      stripDynamicDefaults(schemas as Record<string, SchemaObject>);
    }

    applyExampleMaxDepth(
      schemas as Record<string, SchemaObject>,
      exampleMaxDepth
    );

    return {
      ...this.transformer.normalizePaths(flatten(denormalizedPaths)),
      components: {
        schemas: schemas as Record<string, SchemaObject | ReferenceObject>
      }
    };
  }

  private getExplicitlyImportedGlobalModuleTokens(
    container: NestContainer,
    module: Module
  ): Set<string> | undefined {
    const tokenFactory = container.getModuleTokenFactory();
    const staticImports =
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, module.metatype) || [];
    const dynamicImports =
      container.getDynamicMetadataByToken(module.token, 'imports') || [];
    const tokens = new Set<string>();

    for (const importedModule of [...staticImports, ...dynamicImports]) {
      const token = this.getModuleToken(importedModule, tokenFactory);
      if (token === undefined || !container.getModules().has(token)) {
        // createDocument is synchronous. Preserve the previous scan behavior
        // when an async import cannot be mapped to an exact registration, or
        // when its token no longer matches one (deep-hash metadata changed
        // after bootstrap).
        return undefined;
      }
      tokens.add(token);
    }

    return tokens;
  }

  private getModuleToken(
    moduleReference:
      Type<unknown> | DynamicModule | ForwardReference | Promise<DynamicModule>,
    tokenFactory: ReturnType<NestContainer['getModuleTokenFactory']>
  ): string | undefined {
    let reference:
      | Type<unknown>
      | DynamicModule
      | ForwardReference
      | Promise<DynamicModule> = moduleReference;

    if (
      'forwardRef' in reference &&
      typeof reference.forwardRef === 'function'
    ) {
      // Unwrapped first: a forward reference may resolve to a promise
      reference = reference.forwardRef();
    }
    if (!reference || reference instanceof Promise) {
      return undefined;
    }

    if ('module' in reference) {
      const { module: metatype, ...dynamicMetadata } = reference;
      return tokenFactory.createForDynamic(
        metatype,
        dynamicMetadata,
        reference
      );
    }

    return tokenFactory.createForStatic(
      reference as Type<unknown>,
      reference as Type<unknown>
    );
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
      onlyIncludeDecoratedEndpoints?: boolean;
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

  private initializeSwaggerExplorer(
    httpAdapterType: string,
    standardSchemaConverter?: SwaggerDocumentOptions['standardSchemaConverter']
  ) {
    this.explorer = new SwaggerExplorer(this.schemaObjectFactory, {
      httpAdapterType,
      standardSchemaConverter
    });
  }
}

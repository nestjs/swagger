import { RequestMethod, VersioningType } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  VERSION_METADATA
} from '@nestjs/common/constants';
import {
  Controller,
  Type,
  VERSION_NEUTRAL,
  VersioningOptions,
  VersionValue
} from '@nestjs/common/interfaces';
import {
  addLeadingSlash,
  isUndefined
} from '@nestjs/common/utils/shared.utils';
import { ApplicationConfig, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { LegacyRouteConverter } from '@nestjs/core/router/legacy-route-converter';
import { RoutePathFactory } from '@nestjs/core/router/route-path-factory';
import {
  cloneDeep,
  flatten,
  get,
  head,
  isArray,
  isEmpty,
  mapValues,
  omit,
  omitBy,
  pick
} from 'lodash';
import { parse, Wildcard } from 'path-to-regexp';
import { DECORATORS } from './constants';
import { exploreApiCallbacksMetadata } from './explorers/api-callbacks.explorer';
import { exploreApiExcludeControllerMetadata } from './explorers/api-exclude-controller.explorer';
import { exploreApiExcludeEndpointMetadata } from './explorers/api-exclude-endpoint.explorer';
import {
  exploreApiExtraModelsMetadata,
  exploreGlobalApiExtraModelsMetadata
} from './explorers/api-extra-models.explorer';
import { exploreGlobalApiHeaderMetadata } from './explorers/api-headers.explorer';
import { exploreApiOperationMetadata } from './explorers/api-operation.explorer';
import { exploreApiParametersMetadata } from './explorers/api-parameters.explorer';
import {
  exploreApiResponseMetadata,
  exploreGlobalApiResponseMetadata
} from './explorers/api-response.explorer';
import {
  exploreApiSecurityMetadata,
  exploreGlobalApiSecurityMetadata
} from './explorers/api-security.explorer';
import {
  exploreApiTagsMetadata,
  exploreGlobalApiTagsMetadata
} from './explorers/api-use-tags.explorer';
import { OperationIdFactory } from './interfaces';
import { DenormalizedDocResolvers } from './interfaces/denormalized-doc-resolvers.interface';
import { DenormalizedDoc } from './interfaces/denormalized-doc.interface';
import {
  OpenAPIObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { MimetypeContentWrapper } from './services/mimetype-content-wrapper';
import { SchemaObjectFactory } from './services/schema-object-factory';
import { isBodyParameter } from './utils/is-body-parameter.util';
import { mergeAndUniq } from './utils/merge-and-uniq.util';

export class SwaggerExplorer {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly metadataScanner = new MetadataScanner();
  private readonly schemas: Record<string, SchemaObject> = {};
  private operationIdFactory: OperationIdFactory = (
    controllerKey: string,
    methodKey: string,
    version?: string
  ) =>
    version
      ? controllerKey
        ? `${controllerKey}_${methodKey}_${version}`
        : `${methodKey}_${version}`
      : controllerKey
        ? `${controllerKey}_${methodKey}`
        : methodKey;
  private routePathFactory?: RoutePathFactory;
  private linkNameFactory = (
    controllerKey: string,
    methodKey: string,
    fieldKey: string
  ) =>
    controllerKey
      ? `${controllerKey}_${methodKey}_from_${fieldKey}`
      : `${methodKey}_from_${fieldKey}`;

  constructor(
    private readonly schemaObjectFactory: SchemaObjectFactory,
    private readonly options: {
      httpAdapterType?: string;
    } = {}
  ) {}

  public exploreController(
    wrapper: InstanceWrapper<Controller>,
    applicationConfig: ApplicationConfig,
    options: {
      modulePath?: string;
      globalPrefix?: string;
      operationIdFactory?: OperationIdFactory;
      linkNameFactory?: (
        controllerKey: string,
        methodKey: string,
        fieldKey: string
      ) => string;
      autoTagControllers?: boolean;
    }
  ) {
    const { operationIdFactory, linkNameFactory } = options;

    this.routePathFactory = new RoutePathFactory(applicationConfig);
    if (operationIdFactory) {
      this.operationIdFactory = operationIdFactory;
    }

    if (linkNameFactory) {
      this.linkNameFactory = linkNameFactory;
    }
    const { instance, metatype } = wrapper;
    const prototype = Object.getPrototypeOf(instance);
    const documentResolvers: DenormalizedDocResolvers = {
      root: [
        this.exploreRoutePathAndMethod,
        exploreApiOperationMetadata,
        exploreApiParametersMetadata.bind(null, this.schemas)
      ],
      security: [exploreApiSecurityMetadata],
      tags: [exploreApiTagsMetadata],
      callbacks: [exploreApiCallbacksMetadata],
      responses: [
        exploreApiResponseMetadata.bind(null, this.schemas, {
          operationId: this.operationIdFactory,
          linkName: this.linkNameFactory
        })
      ]
    };
    return this.generateDenormalizedDocument(
      metatype as Type<unknown>,
      prototype,
      instance,
      documentResolvers,
      applicationConfig,
      options
    );
  }

  public getSchemas(): Record<string, SchemaObject> {
    return this.schemas;
  }

  private generateDenormalizedDocument(
    metatype: Type<unknown>,
    prototype: Type<unknown>,
    instance: object,
    documentResolvers: DenormalizedDocResolvers,
    applicationConfig: ApplicationConfig,
    options: {
      modulePath?: string;
      globalPrefix?: string;
      autoTagControllers?: boolean;
    }
  ): DenormalizedDoc[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const excludeController = exploreApiExcludeControllerMetadata(metatype);
    if (excludeController) {
      return [];
    }
    const globalMetadata = this.exploreGlobalMetadata(metatype, {
      autoTagControllers: options.autoTagControllers
    });
    const ctrlExtraModels = exploreGlobalApiExtraModelsMetadata(metatype);
    this.registerExtraModels(ctrlExtraModels);

    const denormalizedPaths = this.metadataScanner.scanFromPrototype<
      any,
      DenormalizedDoc[]
    >(instance, prototype, (name) => {
      const targetCallback = prototype[name];
      const excludeEndpoint = exploreApiExcludeEndpointMetadata(
        instance,
        prototype,
        targetCallback
      );
      if (excludeEndpoint && excludeEndpoint.disable) {
        return;
      }
      const ctrlExtraModels = exploreApiExtraModelsMetadata(
        instance,
        prototype,
        targetCallback
      );
      this.registerExtraModels(ctrlExtraModels);

      const methodMetadata = mapValues(documentResolvers, (explorers: any[]) =>
        explorers.reduce((metadata, fn) => {
          const exploredMetadata = fn.call(
            self,
            instance,
            prototype,
            targetCallback,
            metatype,
            options.globalPrefix,
            options.modulePath,
            applicationConfig,
            options.autoTagControllers
          );
          if (!exploredMetadata) {
            return metadata;
          }
          if (!isArray(exploredMetadata)) {
            if (Array.isArray(metadata)) {
              return metadata.map((item) => ({
                ...item,
                ...exploredMetadata
              }));
            }
            return { ...metadata, ...exploredMetadata };
          }
          return isArray(metadata)
            ? [...metadata, ...exploredMetadata]
            : exploredMetadata;
        }, {})
      );

      if (Array.isArray(methodMetadata.root)) {
        return methodMetadata.root.map((endpointMetadata: DenormalizedDoc) => {
          endpointMetadata = cloneDeep({
            ...methodMetadata,
            root: endpointMetadata as any
          });
          const mergedMethodMetadata = this.mergeMetadata(
            globalMetadata,
            omitBy(endpointMetadata, isEmpty)
          );
          return this.migrateOperationSchema(
            {
              responses: {},
              ...omit(globalMetadata, 'chunks'),
              ...mergedMethodMetadata
            },
            prototype,
            targetCallback
          );
        });
      }
      const mergedMethodMetadata = this.mergeMetadata(
        globalMetadata,
        omitBy(methodMetadata, isEmpty)
      );
      return [
        this.migrateOperationSchema(
          {
            responses: {},
            ...omit(globalMetadata, 'chunks'),
            ...mergedMethodMetadata
          },
          prototype,
          targetCallback
        )
      ];
    });

    return flatten(denormalizedPaths).filter((path) => path.root?.path);
  }

  private exploreGlobalMetadata(
    metatype: Type<unknown>,
    options: {
      autoTagControllers?: boolean;
    }
  ): Partial<OpenAPIObject> {
    const globalExplorers = [
      exploreGlobalApiTagsMetadata(options.autoTagControllers),
      exploreGlobalApiSecurityMetadata,
      exploreGlobalApiResponseMetadata.bind(null, this.schemas),
      exploreGlobalApiHeaderMetadata
    ];
    const globalMetadata = globalExplorers
      .map((explorer) => explorer.call(explorer, metatype))
      .filter((val) => !isUndefined(val))
      .reduce((curr, next) => {
        if (next.depth) {
          return {
            ...curr,
            chunks: (curr.chunks || []).concat(next)
          };
        }
        return { ...curr, ...next };
      }, {});

    return globalMetadata;
  }

  private exploreRoutePathAndMethod(
    instance: object,
    prototype: Type<unknown>,
    method: Function,
    metatype: Type<unknown>,
    globalPrefix: string | undefined,
    modulePath: string | undefined,
    applicationConfig: ApplicationConfig
  ) {
    const methodPath = Reflect.getMetadata(PATH_METADATA, method);
    if (isUndefined(methodPath)) {
      return undefined;
    }
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      method
    ) as RequestMethod;

    const methodVersion: VersionValue | undefined = Reflect.getMetadata(
      VERSION_METADATA,
      method
    );
    const versioningOptions = applicationConfig.getVersioning();
    const controllerVersion = this.getVersionMetadata(
      metatype,
      versioningOptions
    );

    const versionOrVersions = methodVersion ?? controllerVersion;
    const versions = this.getRoutePathVersions(
      versionOrVersions,
      versioningOptions
    );

    const allRoutePaths = this.routePathFactory.create(
      {
        methodPath,
        methodVersion,
        modulePath,
        globalPrefix,
        controllerVersion,
        ctrlPath: this.reflectControllerPath(metatype),
        versioningOptions: applicationConfig.getVersioning()
      },
      requestMethod
    );

    return flatten(
      allRoutePaths.map((routePath, index) => {
        const fullPath = this.validateRoutePath(routePath);
        const apiExtension = Reflect.getMetadata(
          DECORATORS.API_EXTENSION,
          method
        );
        if (requestMethod === RequestMethod.ALL) {
          // Workaround for the invalid "ALL" Method
          const validMethods = [
            'get',
            'post',
            'put',
            'delete',
            'patch',
            'options',
            'head',
            'search'
          ];

          return validMethods.map((requestMethod) => ({
            method: requestMethod,
            path: fullPath === '' ? '/' : fullPath,
            operationId: `${this.getOperationId(
              instance,
              method.name
            )}_${requestMethod.toLowerCase()}`,
            ...apiExtension
          }));
        }

        const pathVersion = versions.find(
          (v) => fullPath.includes(`/${v}/`) || fullPath.endsWith(`/${v}`)
        );
        const isAlias =
          allRoutePaths.length > 1 && allRoutePaths.length !== versions.length;
        const methodKey = isAlias ? `${method.name}[${index}]` : method.name;
        return {
          method: RequestMethod[requestMethod].toLowerCase(),
          path: fullPath === '' ? '/' : fullPath,
          operationId: this.getOperationId(instance, methodKey, pathVersion),
          ...apiExtension
        };
      })
    );
  }

  private getOperationId(
    instance: object,
    methodKey: string,
    version?: string
  ): string {
    return this.operationIdFactory(
      instance.constructor?.name || '',
      methodKey,
      version
    );
  }

  private getRoutePathVersions(
    versionValue?: VersionValue,
    versioningOptions?: VersioningOptions
  ) {
    let versions: string[] = [];

    if (!versionValue || versioningOptions?.type !== VersioningType.URI) {
      return versions;
    }

    if (Array.isArray(versionValue)) {
      versions = versionValue.filter((v) => v !== VERSION_NEUTRAL);
    } else if (versionValue !== VERSION_NEUTRAL) {
      versions = [versionValue];
    }

    const prefix = this.routePathFactory.getVersionPrefix(versioningOptions);
    versions = versions.map((v) => `${prefix}${v}`);

    return versions;
  }

  private reflectControllerPath(metatype: Type<unknown>): string {
    return Reflect.getMetadata(PATH_METADATA, metatype);
  }

  private validateRoutePath(path: string): string {
    if (isUndefined(path)) {
      return '';
    }
    if (Array.isArray(path)) {
      path = head(path);
    }
    let pathWithParams = '';

    try {
      let normalizedPath = LegacyRouteConverter.tryConvert(path, {
        // Skip logs for Fastify as it has different rules for wildcard routes
        logs: this.options.httpAdapterType !== 'fastify'
      });
      // Optional segment groups are not supported by Fastify
      normalizedPath = normalizedPath.replace(/::/g, '\\:');
      normalizedPath = normalizedPath.replace(/\[:\]/g, '\\:');
      // Strip inline regexps (Fastify)
      normalizedPath = normalizedPath.replace(/\(\^([^)]+)\)/g, '');

      const { tokens } = parse(normalizedPath);
      for (const item of tokens) {
        if (item.type === 'text') {
          pathWithParams += item.value;
        } else if (item.type === 'param') {
          pathWithParams += `{${item.name}}`;
        } else if (item.type === 'wildcard') {
          pathWithParams += `{${item.name}}`;
        } else if (item.type === 'group') {
          // Flatten the optional parameter groups to a single parameter
          pathWithParams += item.tokens.reduce(
            (acc, item) =>
              acc +
              (item.type === 'text'
                ? item.value
                : `{${(item as Wildcard).name}}`),
            ''
          );
        }
      }
    } catch (err) {
      if (err instanceof TypeError) {
        LegacyRouteConverter.printError(path);
      }
      throw err;
    }
    return pathWithParams === '/' ? '' : addLeadingSlash(pathWithParams);
  }

  private mergeMetadata(
    globalMetadata: Record<string, any>,
    methodMetadata: Record<string, any>
  ): Record<string, any> {
    if (methodMetadata.root && !methodMetadata.root.parameters) {
      methodMetadata.root.parameters = [];
    }
    const deepMerge =
      (metadata: Record<string, any>) =>
      (value: Record<string, unknown>, key: string) => {
        if (!metadata[key]) {
          return value;
        }
        const globalValue = metadata[key];
        if (metadata.depth) {
          return this.deepMergeMetadata(globalValue, value, metadata.depth);
        }
        return this.mergeValues(globalValue, value);
      };

    if (globalMetadata.chunks) {
      const { chunks } = globalMetadata;
      chunks.forEach((chunk: Record<string, any>) => {
        methodMetadata = mapValues(methodMetadata, deepMerge(chunk));
      });
    }
    return mapValues(methodMetadata, deepMerge(globalMetadata));
  }

  private deepMergeMetadata(
    globalValue: Record<string, any> | Array<any>,
    methodValue: Record<string, any> | Array<any>,
    maxDepth: number,
    currentDepthLevel = 0
  ) {
    if (currentDepthLevel === maxDepth) {
      return this.mergeValues(globalValue, methodValue);
    }
    return mapValues(methodValue, (value, key) => {
      if (key in globalValue) {
        return this.deepMergeMetadata(
          (globalValue as Record<string, any>)[key],
          (methodValue as Record<string, any>)[key],
          maxDepth,
          currentDepthLevel + 1
        );
      }
      return value;
    });
  }

  private mergeValues(
    globalValue: Record<string, any> | Array<any>,
    methodValue: Record<string, any> | Array<any>
  ) {
    if (!isArray(globalValue)) {
      return { ...globalValue, ...methodValue };
    }
    return [...globalValue, ...(methodValue as Array<any>)];
  }

  /**
   * Migrates operation schema from OpenAPI 2.0 to OpenAPI 3.0
   * Simply moves "body" parameter under "requestBody" property
   */
  private migrateOperationSchema(
    document: DenormalizedDoc,
    prototype: Type<unknown>,
    method: Function
  ) {
    const parametersObject: Record<string, any>[] = get(
      document,
      'root.parameters'
    );
    const requestBodyIndex = (parametersObject || []).findIndex(
      isBodyParameter
    );
    if (requestBodyIndex < 0) {
      return document;
    }
    const requestBody = parametersObject[requestBodyIndex];
    parametersObject.splice(requestBodyIndex, 1);

    const classConsumes = Reflect.getMetadata(
      DECORATORS.API_CONSUMES,
      prototype
    );
    const methodConsumes = Reflect.getMetadata(DECORATORS.API_CONSUMES, method);
    let consumes = mergeAndUniq(classConsumes, methodConsumes);
    consumes = isEmpty(consumes) ? ['application/json'] : consumes;

    const keysToRemove = ['schema', 'in', 'name', 'examples'];
    document.root.requestBody = {
      ...omit(requestBody, keysToRemove),
      ...this.mimetypeContentWrapper.wrap(
        consumes,
        pick(requestBody, ['schema', 'examples'])
      )
    };
    return document;
  }

  private registerExtraModels(extraModels: Function[]) {
    extraModels.forEach((item) =>
      this.schemaObjectFactory.exploreModelSchema(item, this.schemas)
    );
  }

  private getVersionMetadata(
    metatype: Type<unknown> | Function,
    versioningOptions: VersioningOptions | undefined
  ): VersionValue | undefined {
    if (versioningOptions?.type === VersioningType.URI) {
      return (
        Reflect.getMetadata(VERSION_METADATA, metatype) ??
        versioningOptions.defaultVersion
      );
    }
  }
}

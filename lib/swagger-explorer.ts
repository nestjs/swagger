import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Controller, Type } from '@nestjs/common/interfaces';
import {
  isString,
  isUndefined,
  validatePath
} from '@nestjs/common/utils/shared.utils';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import {
  get,
  head,
  isArray,
  isEmpty,
  mapValues,
  omit,
  omitBy,
  pick
} from 'lodash';
import * as pathToRegexp from 'path-to-regexp';
import { DECORATORS } from './constants';
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
  private operationIdFactory = (controllerKey: string, methodKey: string) =>
    controllerKey ? `${controllerKey}_${methodKey}` : methodKey;

  constructor(private readonly schemaObjectFactory: SchemaObjectFactory) {}

  public exploreController(
    wrapper: InstanceWrapper<Controller>,
    modulePath?: string,
    globalPrefix?: string,
    operationIdFactory?: (controllerKey: string, methodKey: string) => string
  ) {
    if (operationIdFactory) {
      this.operationIdFactory = operationIdFactory;
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
      responses: [exploreApiResponseMetadata.bind(null, this.schemas)]
    };
    return this.generateDenormalizedDocument(
      metatype as Type<unknown>,
      prototype,
      instance,
      documentResolvers,
      modulePath,
      globalPrefix
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
    modulePath?: string,
    globalPrefix?: string
  ): DenormalizedDoc[] {
    let path = this.validateRoutePath(this.reflectControllerPath(metatype));
    if (modulePath) {
      // re-validate the route after adding the module path,
      // since maybe module path itself has url parameters segments.
      path = this.validateRoutePath(modulePath + path);
    }
    if (globalPrefix) {
      path = validatePath(globalPrefix) + path;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const globalMetadata = this.exploreGlobalMetadata(metatype);
    const ctrlExtraModels = exploreGlobalApiExtraModelsMetadata(metatype);
    this.registerExtraModels(ctrlExtraModels);

    const denormalizedPaths = this.metadataScanner.scanFromPrototype<
      any,
      DenormalizedDoc
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
            path
          );
          if (!exploredMetadata) {
            return metadata;
          }
          if (!isArray(exploredMetadata)) {
            return { ...metadata, ...exploredMetadata };
          }
          return isArray(metadata)
            ? [...metadata, ...exploredMetadata]
            : exploredMetadata;
        }, {})
      );
      const mergedMethodMetadata = this.mergeMetadata(
        globalMetadata,
        omitBy(methodMetadata, isEmpty)
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
    return denormalizedPaths;
  }

  private exploreGlobalMetadata(
    metatype: Type<unknown>
  ): Partial<OpenAPIObject> {
    const globalExplorers = [
      exploreGlobalApiTagsMetadata,
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
    globalPath: string
  ) {
    const routePath = Reflect.getMetadata(PATH_METADATA, method);
    if (isUndefined(routePath)) {
      return undefined;
    }
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      method
    ) as RequestMethod;
    const fullPath = globalPath + this.validateRoutePath(routePath);
    const apiExtension = Reflect.getMetadata(DECORATORS.API_EXTENSION, method);
    return {
      method: RequestMethod[requestMethod].toLowerCase(),
      path: fullPath === '' ? '/' : fullPath,
      operationId: this.getOperationId(instance, method),
      ...apiExtension
    };
  }

  private getOperationId(instance: object, method: Function): string {
    return this.operationIdFactory(
      instance.constructor?.name || '',
      method.name
    );
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
    for (const item of pathToRegexp.parse(path)) {
      pathWithParams += isString(item) ? item : `${item.prefix}{${item.name}}`;
    }
    return pathWithParams === '/' ? '' : validatePath(pathWithParams);
  }

  private mergeMetadata(
    globalMetadata: Record<string, any>,
    methodMetadata: Record<string, any>
  ): Record<string, any> {
    if (methodMetadata.root && !methodMetadata.root.parameters) {
      methodMetadata.root.parameters = [];
    }
    const deepMerge = (metadata: Record<string, any>) => (
      value: Record<string, unknown>,
      key: string
    ) => {
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

    const keysToRemove = ['schema', 'in', 'name'];
    document.root.requestBody = {
      ...omit(requestBody, keysToRemove),
      ...this.mimetypeContentWrapper.wrap(consumes, pick(requestBody, 'schema'))
    };
    return document;
  }

  private registerExtraModels(extraModels: Function[]) {
    extraModels.forEach((item) =>
      this.schemaObjectFactory.exploreModelSchema(item, this.schemas)
    );
  }
}

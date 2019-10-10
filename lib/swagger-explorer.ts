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
import { get, isArray, isEmpty, mapValues, omit, omitBy, pick } from 'lodash';
import * as pathToRegexp from 'path-to-regexp';
import { DECORATORS } from './constants';
import { exploreApiExcludeEndpointMetadata } from './explorers/api-exclude-endpoint.explorer';
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
  exploreApiUseTagsMetadata,
  exploreGlobalApiUseTagsMetadata
} from './explorers/api-use-tags.explorer';
import { DenormalizedDocResolvers } from './interfaces/denormalized-doc-resolvers.interface';
import { DenormalizedDoc } from './interfaces/denormalized-doc.interface';
import {
  OpenAPIObject,
  SchemaObject
} from './interfaces/open-api-spec.interface';
import { MimetypeContentWrapper } from './services/mimetype-content-wrapper';
import { isBodyParameter } from './utils/is-body-parameter.util';
import { mergeAndUniq } from './utils/merge-and-uniq.util';

export class SwaggerExplorer {
  private readonly mimetypeContentWrapper = new MimetypeContentWrapper();
  private readonly metadataScanner = new MetadataScanner();
  private readonly schemas: SchemaObject[] = [];

  public exploreController(
    wrapper: InstanceWrapper<Controller>,
    modulePath: string
  ) {
    const { instance, metatype } = wrapper;
    const prototype = Object.getPrototypeOf(instance);
    const documentResolvers: DenormalizedDocResolvers = {
      root: [
        this.exploreRoutePathAndMethod,
        exploreApiOperationMetadata,
        exploreApiParametersMetadata.bind(null, this.schemas)
      ],
      security: [exploreApiSecurityMetadata],
      tags: [exploreApiUseTagsMetadata],
      responses: [exploreApiResponseMetadata.bind(null, this.schemas)]
    };
    return this.generateDenormalizedDocument(
      metatype as Type<unknown>,
      prototype,
      instance,
      documentResolvers,
      modulePath
    );
  }

  public getSchemas(): SchemaObject[] {
    return this.schemas;
  }

  private generateDenormalizedDocument(
    metatype: Type<unknown>,
    prototype: Type<unknown>,
    instance: object,
    documentResolvers: DenormalizedDocResolvers,
    modulePath: string
  ): DenormalizedDoc[] {
    let path = this.validateRoutePath(this.reflectControllerPath(metatype));
    if (modulePath) {
      // re-validate the route after adding the module path,
      // since maybe module path itself has url parameters segments.
      path = this.validateRoutePath(modulePath + path);
    }
    const self = this;
    const globalMetadata = this.exploreGlobalMetadata(metatype);
    const denormalizedPaths = this.metadataScanner.scanFromPrototype<
      any,
      DenormalizedDoc
    >(instance, prototype, name => {
      const targetCallback = prototype[name];
      const excludeEndpoint = exploreApiExcludeEndpointMetadata(
        instance,
        prototype,
        targetCallback
      );
      if (excludeEndpoint && excludeEndpoint.disable) {
        return;
      }
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
          ...globalMetadata,
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
      exploreGlobalApiUseTagsMetadata,
      exploreGlobalApiSecurityMetadata,
      exploreGlobalApiResponseMetadata.bind(null, this.schemas)
    ];
    const globalMetadata = globalExplorers
      .map(explorer => explorer.call(explorer, metatype))
      .filter(val => !isUndefined(val))
      .reduce((curr, next) => ({ ...curr, ...next }), {});

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
    return {
      method: RequestMethod[requestMethod].toLowerCase(),
      path: fullPath === '' ? '/' : fullPath,
      operationId: method.name
    };
  }

  private reflectControllerPath(metatype: Type<unknown>): string {
    return Reflect.getMetadata(PATH_METADATA, metatype);
  }

  private validateRoutePath(path: string): string {
    if (isUndefined(path)) {
      return '';
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
    return mapValues(methodMetadata, (value, key) => {
      if (!globalMetadata[key]) {
        return value;
      }
      const globalValue = globalMetadata[key];
      if (!isArray(globalValue)) {
        return { ...globalValue, ...value };
      }
      return [...globalValue, ...value];
    });
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
}

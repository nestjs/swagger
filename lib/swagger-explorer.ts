import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Controller } from '@nestjs/common/interfaces';
import {
  isString,
  isUndefined,
  validatePath
} from '@nestjs/common/utils/shared.utils';
import { InstanceWrapper } from '@nestjs/core/injector/container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { isArray, isEmpty, mapValues, omitBy } from 'lodash';
import * as pathToRegexp from 'path-to-regexp';
import {
  exploreApiConsumesMetadata,
  exploreGlobalApiConsumesMetadata
} from './explorers/api-consumes.explorer';
import { exploreApiExcludeEndpointMetadata } from './explorers/api-exclude-endpoint.explorer';
import { exploreApiOperationMetadata } from './explorers/api-operation.explorer';
import { exploreApiParametersMetadata } from './explorers/api-parameters.explorer';
import {
  exploreApiProducesMetadata,
  exploreGlobalApiProducesMetadata
} from './explorers/api-produces.explorer';
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

export class SwaggerExplorer {
  private readonly metadataScanner = new MetadataScanner();
  private readonly modelsDefinitions = [];

  public exploreController(
    { instance, metatype }: InstanceWrapper<Controller>,
    modulePath: string
  ) {
    const prototype = Object.getPrototypeOf(instance);
    const explorersSchema = {
      root: [
        this.exploreRoutePathAndMethod,
        exploreApiOperationMetadata,
        exploreApiParametersMetadata.bind(null, this.modelsDefinitions)
      ],
      produces: [exploreApiProducesMetadata],
      consumes: [exploreApiConsumesMetadata],
      security: [exploreApiSecurityMetadata],
      tags: [exploreApiUseTagsMetadata],
      responses: [exploreApiResponseMetadata.bind(null, this.modelsDefinitions)]
    };
    return this.generateDenormalizedDocument(
      metatype,
      prototype,
      instance,
      explorersSchema,
      modulePath
    );
  }

  public getModelsDefinitons() {
    return this.modelsDefinitions;
  }

  private generateDenormalizedDocument(
    metatype,
    prototype,
    instance,
    explorersSchema,
    modulePath
  ) {
    let path = this.validateRoutePath(this.reflectControllerPath(metatype));
    if (modulePath) {
      path = modulePath + path;
    }
    const self = this;
    const globalMetadata = this.exploreGlobalMetadata(metatype);
    const denormalizedPaths = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      name => {
        const targetCallback = prototype[name];
        const excludeEndpoint = exploreApiExcludeEndpointMetadata(
          instance,
          prototype,
          targetCallback
        );
        if (excludeEndpoint && excludeEndpoint.disable) {
          return;
        }
        const methodMetadata = mapValues(explorersSchema, (explorers: any[]) =>
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
        this.assignDefaultMimeType(mergedMethodMetadata, 'produces');
        this.assignDefaultMimeType(mergedMethodMetadata, 'consumes');
        return {
          responses: {},
          ...globalMetadata,
          ...mergedMethodMetadata
        };
      }
    );
    return denormalizedPaths;
  }

  private exploreGlobalMetadata(metatype) {
    const globalExplorers = [
      exploreGlobalApiProducesMetadata,
      exploreGlobalApiUseTagsMetadata,
      exploreGlobalApiConsumesMetadata,
      exploreGlobalApiSecurityMetadata,
      exploreGlobalApiResponseMetadata.bind(null, this.modelsDefinitions)
    ];
    const globalMetadata = globalExplorers
      .map(explorer => explorer.call(explorer, metatype))
      .filter(val => !isUndefined(val))
      .reduce((curr, next) => ({ ...curr, ...next }), {});

    return globalMetadata;
  }

  private exploreRoutePathAndMethod(instance, prototype, method, globalPath) {
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
      path: fullPath === '' ? '/' : fullPath
    };
  }

  private reflectControllerPath(metatype): string {
    return Reflect.getMetadata(PATH_METADATA, metatype);
  }

  private validateRoutePath(path: string): string {
    if (isUndefined(path)) {
      return '';
    }
    let pathWithParams = '';
    for (const item of pathToRegexp.parse(path)) {
      if (isString(item)) {
        pathWithParams += item;
      } else {
        pathWithParams += `${item.prefix}{${item.name}}`;
      }
    }
    return pathWithParams === '/' ? '' : validatePath(pathWithParams);
  }

  private mergeMetadata(globalMetadata, methodMetadata) {
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

  private assignDefaultMimeType(metadata: any, key: string) {
    if (metadata[key]) {
      return undefined;
    }
    const defaultMimeType = 'application/json';
    metadata[key] = [defaultMimeType];
  }
}

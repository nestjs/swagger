import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { exploreApiConsumesMetadata, exploreGlobalApiConsumesMetadata } from './explorers/api-consumes.explorer';
import { exploreApiProducesMetadata, exploreGlobalApiProducesMetadata } from './explorers/api-produces.explorer';
import { exploreApiResponseMetadata, exploreGlobalApiResponseMetadata } from './explorers/api-response.explorer';
import { exploreApiSecurityMetadata, exploreGlobalApiSecurityMetadata } from './explorers/api-security.explorer';
import { exploreApiUseTagsMetadata, exploreGlobalApiUseTagsMetadata } from './explorers/api-use-tags.explorer';
import { isArray, isEmpty, mapValues, omitBy } from 'lodash';
import { isUndefined, validatePath } from '@nestjs/common/utils/shared.utils';

import { Controller } from '@nestjs/common/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { RequestMethod } from '@nestjs/common';
import { exploreApiOperationMetadata } from './explorers/api-operation.explorer';
import { exploreApiParametersMetadata } from './explorers/api-parameters.explorer';

export class SwaggerExplorer {
    private readonly metadataScanner = new MetadataScanner();
    private readonly modelsDefinitions = [];

    public exploreController({ instance, metatype }: InstanceWrapper<Controller>) {
        const prototype = Object.getPrototypeOf(instance);
        const explorersSchema = {
            root: [
                this.exploreRoutePathAndMethod,
                exploreApiOperationMetadata,
                exploreApiParametersMetadata.bind(null, this.modelsDefinitions),
            ],
            produces: [exploreApiProducesMetadata],
            consumes: [exploreApiConsumesMetadata],
            security: [exploreApiSecurityMetadata],
            tags: [exploreApiUseTagsMetadata],
            responses: [exploreApiResponseMetadata.bind(null, this.modelsDefinitions)],
        };
        return this.generateDenormalizedDocument(metatype, prototype, instance, explorersSchema);
    }

    public getModelsDefinitons() {
        return this.modelsDefinitions;
    }

    private generateDenormalizedDocument(metatype, prototype, instance, explorersSchema) {
        const path = this.validateRoutePath(this.reflectControllerPath(metatype));

        const self = this;
        const globalMetadata = this.exploreGlobalMetadata(metatype);
        const denormalizedPaths = this.metadataScanner.scanFromPrototype(instance, prototype, (name) => {
            const targetCallback = prototype[name];
            const methodMetadata = mapValues(explorersSchema, (explorers: any[]) => explorers.reduce((metadata, fn) => {
                const exploredMetadata = fn.call(self, instance, prototype, targetCallback, path);
                if (!exploredMetadata) {
                  return metadata;
                }
                if (!isArray(exploredMetadata)) {
                  return { ...metadata, ...exploredMetadata };
                }
                return isArray(metadata) ? [...metadata, ...exploredMetadata] : exploredMetadata;
            }, {}));
            return {
                responses: {},
                ...globalMetadata,
                ...omitBy(methodMetadata, isEmpty),
            };
        });
        return denormalizedPaths;
    }

    private exploreGlobalMetadata(metatype) {
        const globalExplorers = [
            exploreGlobalApiProducesMetadata,
            exploreGlobalApiUseTagsMetadata,
            exploreGlobalApiConsumesMetadata,
            exploreGlobalApiSecurityMetadata,
            exploreGlobalApiResponseMetadata.bind(null, this.modelsDefinitions),
        ];
        const globalMetadata = (
            globalExplorers.map((explorer) => explorer.call(explorer, metatype)).filter((val) => !isUndefined(val))
        ).reduce((curr, next) => ({
            ...curr,
            ...next,
        }), {});

        return globalMetadata;
    }

    private exploreRoutePathAndMethod(instance, prototype, method, globalPath) {
        const routePath = Reflect.getMetadata(PATH_METADATA, method);
        if (isUndefined(routePath)) {
            return undefined;
        }
        const requestMethod = Reflect.getMetadata(METHOD_METADATA, method) as RequestMethod;
        const fullPath = globalPath + this.validateRoutePath(routePath);
        return {
            method: RequestMethod[requestMethod].toLowerCase(),
            path: fullPath === '' ? '/' : fullPath,
        };
    }

    private reflectControllerPath(metatype): string {
        return Reflect.getMetadata(PATH_METADATA, metatype);
    }

    private validateRoutePath(path: string): string {
        if (isUndefined(path)) {
            return '';
        }
        const pathWithParams = path.replace(/([:].*?[^\/]*)/g, (str) => {
            str = str.replace(/\(.*\)$/, '');   // remove any regex in the param
            return `{${str.slice(1, str.length)}}`;
        });
        return pathWithParams === '/' ? '' : validatePath(pathWithParams);
    }
}

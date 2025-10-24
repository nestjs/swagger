"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exploreApiResponseMetadata = exports.exploreGlobalApiResponseMetadata = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lodash_1 = require("lodash");
const constants_2 = require("../constants");
const decorators_1 = require("../decorators");
const plugin_constants_1 = require("../plugin/plugin-constants");
const response_object_factory_1 = require("../services/response-object-factory");
const global_responses_storage_1 = require("../storages/global-responses.storage");
const merge_and_uniq_util_1 = require("../utils/merge-and-uniq.util");
const responseObjectFactory = new response_object_factory_1.ResponseObjectFactory();
const exploreGlobalApiResponseMetadata = (schemas, metatype, factories) => {
    const responses = Reflect.getMetadata(constants_2.DECORATORS.API_RESPONSE, metatype);
    const globalResponses = global_responses_storage_1.GlobalResponsesStorage.getAll();
    const mappedGlobalResponsesOrUndefined = globalResponses
        ? mapResponsesToSwaggerResponses(globalResponses, schemas, undefined, factories)
        : undefined;
    const produces = Reflect.getMetadata(constants_2.DECORATORS.API_PRODUCES, metatype);
    return responses
        ? {
            responses: Object.assign(Object.assign({}, mappedGlobalResponsesOrUndefined), mapResponsesToSwaggerResponses(responses, schemas, produces, factories))
        }
        : mappedGlobalResponsesOrUndefined
            ? {
                responses: mappedGlobalResponsesOrUndefined
            }
            : undefined;
};
exports.exploreGlobalApiResponseMetadata = exploreGlobalApiResponseMetadata;
const exploreApiResponseMetadata = (schemas, factories, instance, prototype, method) => {
    applyMetadataFactory(prototype, instance);
    const responses = Reflect.getMetadata(constants_2.DECORATORS.API_RESPONSE, method);
    if (responses) {
        const classProduces = Reflect.getMetadata(constants_2.DECORATORS.API_PRODUCES, prototype);
        const methodProduces = Reflect.getMetadata(constants_2.DECORATORS.API_PRODUCES, method);
        const produces = (0, merge_and_uniq_util_1.mergeAndUniq)((0, lodash_1.get)(classProduces, 'produces'), methodProduces);
        return mapResponsesToSwaggerResponses(responses, schemas, produces, factories);
    }
    const status = getStatusCode(method);
    if (status) {
        return { [status]: { description: '' } };
    }
    return undefined;
};
exports.exploreApiResponseMetadata = exploreApiResponseMetadata;
const getStatusCode = (method) => {
    const status = Reflect.getMetadata(constants_1.HTTP_CODE_METADATA, method);
    if (status) {
        return status;
    }
    const requestMethod = Reflect.getMetadata(constants_1.METHOD_METADATA, method);
    switch (requestMethod) {
        case common_1.RequestMethod.POST:
            return common_1.HttpStatus.CREATED;
        default:
            return common_1.HttpStatus.OK;
    }
};
const omitParamType = (param) => (0, lodash_1.omit)(param, 'type');
const mapResponsesToSwaggerResponses = (responses, schemas, produces = ['application/json'], factories) => {
    produces = (0, shared_utils_1.isEmpty)(produces) ? ['application/json'] : produces;
    const openApiResponses = (0, lodash_1.mapValues)(responses, (response) => responseObjectFactory.create(response, produces, schemas, factories));
    return (0, lodash_1.mapValues)(openApiResponses, omitParamType);
};
function applyMetadataFactory(prototype, instance) {
    const classPrototype = prototype;
    do {
        if (!prototype.constructor) {
            return;
        }
        if (!prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]) {
            continue;
        }
        const metadata = prototype.constructor[plugin_constants_1.METADATA_FACTORY_NAME]();
        const methodKeys = Object.keys(metadata).filter((key) => typeof instance[key] === 'function');
        methodKeys.forEach((key) => {
            const _a = metadata[key], { summary, deprecated, tags } = _a, meta = __rest(_a, ["summary", "deprecated", "tags"]);
            if (Object.keys(meta).length === 0) {
                return;
            }
            if (meta.status === undefined) {
                meta.status = getStatusCode(instance[key]);
            }
            (0, decorators_1.ApiResponse)(meta, { overrideExisting: false })(classPrototype, key, Object.getOwnPropertyDescriptor(classPrototype, key));
        });
    } while ((prototype = Reflect.getPrototypeOf(prototype)) &&
        prototype !== Object.prototype &&
        prototype);
}

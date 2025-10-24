"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePluginOptions = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const plugin_debug_logger_1 = require("./plugin-debug-logger");
const defaultOptions = {
    dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
    controllerFileNameSuffix: ['.controller.ts'],
    classValidatorShim: true,
    classTransformerShim: false,
    dtoKeyOfComment: 'description',
    controllerKeyOfComment: 'summary',
    introspectComments: false,
    esmCompatible: false,
    readonly: false,
    debug: false,
    skipDefaultValues: false
};
const mergePluginOptions = (options = {}) => {
    if ((0, shared_utils_1.isString)(options.dtoFileNameSuffix)) {
        options.dtoFileNameSuffix = [options.dtoFileNameSuffix];
    }
    if ((0, shared_utils_1.isString)(options.controllerFileNameSuffix)) {
        options.controllerFileNameSuffix = [options.controllerFileNameSuffix];
    }
    for (const key of ['dtoFileNameSuffix', 'controllerFileNameSuffix']) {
        if (options[key] && options[key].includes('.ts')) {
            plugin_debug_logger_1.pluginDebugLogger.warn(`Skipping ${key} option ".ts" because it can cause unwanted behaviour.`);
            options[key] = options[key].filter((pattern) => pattern !== '.ts');
            if (options[key].length == 0) {
                delete options[key];
            }
        }
    }
    return Object.assign(Object.assign({}, defaultOptions), options);
};
exports.mergePluginOptions = mergePluginOptions;

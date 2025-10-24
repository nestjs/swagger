"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.before = void 0;
const merge_options_1 = require("./merge-options");
const plugin_debug_logger_1 = require("./plugin-debug-logger");
const is_filename_matched_util_1 = require("./utils/is-filename-matched.util");
const controller_class_visitor_1 = require("./visitors/controller-class.visitor");
const model_class_visitor_1 = require("./visitors/model-class.visitor");
const modelClassVisitor = new model_class_visitor_1.ModelClassVisitor();
const controllerClassVisitor = new controller_class_visitor_1.ControllerClassVisitor();
const before = (options, program) => {
    options = (0, merge_options_1.mergePluginOptions)(options);
    if (!program) {
        const error = `The "program" reference must be provided when using the CLI Plugin. This error is likely caused by the "isolatedModules" compiler option being set to "true".`;
        plugin_debug_logger_1.pluginDebugLogger.debug(error);
        throw new Error(error);
    }
    return (ctx) => {
        return (sf) => {
            if ((0, is_filename_matched_util_1.isFilenameMatched)(options.dtoFileNameSuffix, sf.fileName)) {
                return modelClassVisitor.visit(sf, ctx, program, options);
            }
            if ((0, is_filename_matched_util_1.isFilenameMatched)(options.controllerFileNameSuffix, sf.fileName)) {
                return controllerClassVisitor.visit(sf, ctx, program, options);
            }
            return sf;
        };
    };
};
exports.before = before;

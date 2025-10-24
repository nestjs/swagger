"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadonlyVisitor = void 0;
const ts = require("typescript");
const merge_options_1 = require("../merge-options");
const is_filename_matched_util_1 = require("../utils/is-filename-matched.util");
const controller_class_visitor_1 = require("./controller-class.visitor");
const model_class_visitor_1 = require("./model-class.visitor");
class ReadonlyVisitor {
    get typeImports() {
        return Object.assign(Object.assign({}, this.modelClassVisitor.typeImports), this.controllerClassVisitor.typeImports);
    }
    constructor(options) {
        this.options = options;
        this.key = '@nestjs/swagger';
        this.modelClassVisitor = new model_class_visitor_1.ModelClassVisitor();
        this.controllerClassVisitor = new controller_class_visitor_1.ControllerClassVisitor();
        options.readonly = true;
        if (!options.pathToSource) {
            throw new Error(`"pathToSource" must be defined in plugin options`);
        }
    }
    visit(program, sf) {
        const factoryHost = { factory: ts.factory };
        const parsedOptions = (0, merge_options_1.mergePluginOptions)(this.options);
        if ((0, is_filename_matched_util_1.isFilenameMatched)(parsedOptions.dtoFileNameSuffix, sf.fileName)) {
            return this.modelClassVisitor.visit(sf, factoryHost, program, parsedOptions);
        }
        if ((0, is_filename_matched_util_1.isFilenameMatched)(parsedOptions.controllerFileNameSuffix, sf.fileName)) {
            return this.controllerClassVisitor.visit(sf, factoryHost, program, parsedOptions);
        }
    }
    collect() {
        return {
            models: this.modelClassVisitor.collectedMetadata(this.options),
            controllers: this.controllerClassVisitor.collectedMetadata(this.options)
        };
    }
}
exports.ReadonlyVisitor = ReadonlyVisitor;

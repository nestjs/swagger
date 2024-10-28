import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options';
import { pluginDebugLogger } from './plugin-debug-logger';
import { isFilenameMatched } from './utils/is-filename-matched.util';
import { ControllerClassVisitor } from './visitors/controller-class.visitor';
import { ModelClassVisitor } from './visitors/model-class.visitor';

const modelClassVisitor = new ModelClassVisitor();
const controllerClassVisitor = new ControllerClassVisitor();

export const before = (options?: Record<string, any>, program?: ts.Program) => {
  options = mergePluginOptions(options);

  if (!program) {
    const error = `The "program" reference must be provided when using the CLI Plugin. This error is likely caused by the "isolatedModules" compiler option being set to "true".`;
    pluginDebugLogger.debug(error);
    throw new Error(error);
  }

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      if (isFilenameMatched(options.dtoFileNameSuffix, sf.fileName)) {
        return modelClassVisitor.visit(sf, ctx, program, options);
      }
      if (isFilenameMatched(options.controllerFileNameSuffix, sf.fileName)) {
        return controllerClassVisitor.visit(sf, ctx, program, options);
      }
      return sf;
    };
  };
};

import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options';
import { ControllerClassVisitor } from './visitors/controller-class.visitor';
import { ModelClassVisitor } from './visitors/model-class.visitor';

const modelClassVisitor = new ModelClassVisitor();
const controllerClassVisitor = new ControllerClassVisitor();
const isFilenameMatched = (patterns: string[], filename: string) =>
  patterns.some((path) => filename.includes(path));

export const before = (options?: Record<string, any>, program?: ts.Program) => {
  options = mergePluginOptions(options);

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

import * as ts from 'typescript';
import { mergePluginOptions } from './merge-options';
import { ControllerClassVisitor } from './visitors/controller-class.visitor';
import { ModelClassVisitor } from './visitors/model-class.visitor';

const modelClassVisitor = new ModelClassVisitor();
const controllerClassVisitor = new ControllerClassVisitor();

export const before = (options?: Record<string, any>, program?: ts.Program) => {
  options = mergePluginOptions(options);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      if (sf.fileName.includes(options.dtoFileNameSuffix)) {
        return modelClassVisitor.visit(sf, ctx, program, options);
      }
      if (sf.fileName.includes(options.controllerFileNameSuffix)) {
        return controllerClassVisitor.visit(sf, ctx, program);
      }
      return sf;
    };
  };
};

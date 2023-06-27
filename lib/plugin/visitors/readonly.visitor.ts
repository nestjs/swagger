import * as ts from 'typescript';
import { PluginOptions, mergePluginOptions } from '../merge-options';
import { isFilenameMatched } from '../utils/is-filename-matched.util';
import { ControllerClassVisitor } from './controller-class.visitor';
import { ModelClassVisitor } from './model-class.visitor';

export class ReadonlyVisitor {
  public readonly key = '@nestjs/swagger';
  private readonly modelClassVisitor = new ModelClassVisitor();
  private readonly controllerClassVisitor = new ControllerClassVisitor();

  get typeImports() {
    return {
      ...this.modelClassVisitor.typeImports,
      ...this.controllerClassVisitor.typeImports
    };
  }

  constructor(private readonly options: PluginOptions) {
    options.readonly = true;

    if (!options.pathToSource) {
      throw new Error(`"pathToSource" must be defined in plugin options`);
    }
  }

  visit(program: ts.Program, sf: ts.SourceFile) {
    const factoryHost = { factory: ts.factory } as any;
    const parsedOptions: Record<string, any> = mergePluginOptions(this.options);

    if (isFilenameMatched(parsedOptions.dtoFileNameSuffix, sf.fileName)) {
      return this.modelClassVisitor.visit(
        sf,
        factoryHost,
        program,
        parsedOptions
      );
    }
    if (
      isFilenameMatched(parsedOptions.controllerFileNameSuffix, sf.fileName)
    ) {
      return this.controllerClassVisitor.visit(
        sf,
        factoryHost,
        program,
        parsedOptions
      );
    }
  }

  collect() {
    return {
      models: this.modelClassVisitor.collectedMetadata,
      controllers: this.controllerClassVisitor.collectedMetadata
    };
  }
}

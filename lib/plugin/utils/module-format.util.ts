import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';

export function resolvePluginOptionsForFile(
  options: PluginOptions,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions
): PluginOptions {
  return {
    ...options,
    esmCompatible: isEsmOutputFile(sourceFile, compilerOptions, options)
  };
}

export function isEsmOutputFile(
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  options?: PluginOptions
): boolean {
  if (options?.esmCompatibleWasConfigured) {
    return options.esmCompatible;
  }

  if (sourceFile.impliedNodeFormat !== undefined) {
    return sourceFile.impliedNodeFormat === ts.ModuleKind.ESNext;
  }

  const impliedNodeFormat = getImpliedNodeFormat(sourceFile, compilerOptions);
  if (impliedNodeFormat !== undefined) {
    return impliedNodeFormat === ts.ModuleKind.ESNext;
  }

  return isEsmModuleKind(compilerOptions.module);
}

function getImpliedNodeFormat(
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions
): ts.ResolutionMode | undefined {
  if (!isNodeModuleKind(compilerOptions.module)) {
    return undefined;
  }

  return ts.getImpliedNodeFormatForFile(
    sourceFile.fileName,
    undefined,
    ts.sys,
    compilerOptions
  );
}

function isEsmModuleKind(moduleKind?: ts.ModuleKind): boolean {
  if (moduleKind === undefined) {
    return false;
  }

  return (
    (moduleKind >= ts.ModuleKind.ES2015 &&
      moduleKind <= ts.ModuleKind.ESNext) ||
    moduleKind === ts.ModuleKind.Preserve
  );
}

function isNodeModuleKind(moduleKind?: ts.ModuleKind): boolean {
  return (
    moduleKind === ts.ModuleKind.Node16 ||
    moduleKind === ts.ModuleKind.Node18 ||
    moduleKind === ts.ModuleKind.Node20 ||
    moduleKind === ts.ModuleKind.NodeNext
  );
}
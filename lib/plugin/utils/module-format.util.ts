import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';

export function resolvePluginOptionsForFile(
  options: PluginOptions,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions
): PluginOptions {
  return {
    ...options,
    esmCompatible: isEsmOutputFile(sourceFile, compilerOptions, options),
    // Mark the resolved value as configured so downstream consumers (e.g.
    // `updateImports`) reuse it instead of re-running the file system lookup.
    esmCompatibleWasConfigured: true
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

/**
 * Resolving the implied module format walks every `package.json` from the source
 * file up to the file system root. The transformer runs per file, so the result
 * is memoized to keep that walk off the hot path.
 */
const impliedNodeFormatCache = new Map<string, ts.ResolutionMode | undefined>();

function getImpliedNodeFormat(
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions
): ts.ResolutionMode | undefined {
  if (!isNodeModuleKind(compilerOptions.module)) {
    return undefined;
  }

  const cacheKey = sourceFile.fileName;
  if (impliedNodeFormatCache.has(cacheKey)) {
    return impliedNodeFormatCache.get(cacheKey);
  }

  const impliedNodeFormat = ts.getImpliedNodeFormatForFile(
    sourceFile.fileName,
    undefined,
    ts.sys,
    compilerOptions
  );
  impliedNodeFormatCache.set(cacheKey, impliedNodeFormat);
  return impliedNodeFormat;
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

import * as ts from 'typescript';
import { PluginOptions, mergePluginOptions } from '../merge-options.js';
import { isFilenameMatched } from '../utils/is-filename-matched.util.js';
import { ControllerClassVisitor } from './controller-class.visitor.js';
import { ModelClassVisitor } from './model-class.visitor.js';

/**
 * Collects source file names from all transitively referenced TypeScript projects.
 * Used internally by {@link ReadonlyVisitor.createTsProgram} to avoid TS6305 errors
 * when a project uses composite project references that have not yet been built.
 */
function collectProjectReferenceSourceFiles(
  projectReferences: readonly ts.ProjectReference[] | undefined,
  visitedProjects = new Set<string>()
): string[] {
  if (!projectReferences) {
    return [];
  }
  const sourceFiles: string[] = [];
  for (const ref of projectReferences) {
    const refConfigPath = ts.resolveProjectReferencePath(ref);
    if (visitedProjects.has(refConfigPath)) {
      continue;
    }
    visitedProjects.add(refConfigPath);
    const parsedRef = ts.getParsedCommandLineOfConfigFile(
      refConfigPath,
      undefined,
      ts.sys as unknown as ts.ParseConfigFileHost
    );
    if (parsedRef) {
      sourceFiles.push(...parsedRef.fileNames);
      sourceFiles.push(
        ...collectProjectReferenceSourceFiles(
          parsedRef.projectReferences,
          visitedProjects
        )
      );
    }
  }
  return sourceFiles;
}

export class ReadonlyVisitor {
  public readonly key = '@nestjs/swagger';
  private readonly modelClassVisitor = new ModelClassVisitor();
  private readonly controllerClassVisitor = new ControllerClassVisitor();

  /**
   * Creates a TypeScript {@link ts.Program} from a `tsconfig.json` file path, correctly
   * handling TypeScript project references (`references` field in tsconfig).
   *
   * When a project uses composite project references, calling `ts.createProgram` with
   * the `projectReferences` option causes TypeScript to require pre-built output files
   * (`.d.ts`) from each referenced project (error TS6305). This method avoids that by
   * resolving all transitively referenced project source files and including them directly
   * in the program's root file names, so no pre-built output is required.
   *
   * @param tsconfigPath Absolute path to the `tsconfig.json` file.
   * @returns A `ts.Program` ready to be passed to {@link ReadonlyVisitor#visit}.
   */
  static createTsProgram(tsconfigPath: string): ts.Program {
    let parseError: ts.Diagnostic | undefined;
    const host: ts.ParseConfigFileHost = {
      ...(ts.sys as unknown as ts.ParseConfigFileHost),
      onUnRecoverableConfigFileDiagnostic(diagnostic: ts.Diagnostic) {
        parseError = diagnostic;
      }
    };
    const parsedCmd = ts.getParsedCommandLineOfConfigFile(
      tsconfigPath,
      undefined,
      host
    );
    if (!parsedCmd || parseError) {
      const message = parseError
        ? ts.flattenDiagnosticMessageText(parseError.messageText, '\n')
        : tsconfigPath;
      throw new Error(`Failed to parse tsconfig at path: ${message}`);
    }
    const { options, fileNames, projectReferences } = parsedCmd;
    const referencedSourceFiles =
      collectProjectReferenceSourceFiles(projectReferences);
    const rootNames = [...new Set([...fileNames, ...referencedSourceFiles])];
    return ts.createProgram({ options, rootNames });
  }

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
      models: this.modelClassVisitor.collectedMetadata(this.options),
      controllers: this.controllerClassVisitor.collectedMetadata(this.options)
    };
  }
}

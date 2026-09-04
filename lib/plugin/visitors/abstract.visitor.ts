import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants.js';
import { isEsmOutputFile } from '../utils/module-format.util.js';
import {
  collectSourceImportSpecifiers,
  getOutputExtension,
  normalizePackagePath
} from '../utils/plugin-utils.js';

const [major, minor] = ts.versionMajorMinor.split('.').map((x) => +x);

export class AbstractFileVisitor {
  /**
   * Output extension per visited file, resolved while the source file (and so
   * its module format) is still known.
   */
  protected readonly _fileOutputExtensions: Record<string, string> = {};

  /**
   * Static namespace imports (import path -> namespace identifier) to hoist
   * into the currently visited file. Inline ESM output cannot use the lazy
   * `require()` / `await import()` forms inside the synchronous metadata
   * factory, so cross-file type references go through these imports instead.
   * Populated per file by `typeReferenceToIdentifier` and flushed by
   * `insertHoistedTypeImports`.
   */
  protected readonly _hoistedTypeImports = new Map<string, string>();

  /**
   * Package specifiers (resolved symbol -> specifier) the currently visited
   * file imports its types through. Refreshed per file by
   * `refreshSourceImportSpecifiers` and read by `typeReferenceToIdentifier`.
   */
  protected _sourceImportSpecifiers = new Map<ts.Symbol, string>();

  /**
   * Reads the visited file's own import declarations, so that a type coming
   * from another package is emitted through the specifier the file already
   * uses instead of the path of the file that declares it.
   */
  protected refreshSourceImportSpecifiers(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
  ) {
    this._sourceImportSpecifiers = collectSourceImportSpecifiers(
      sourceFile,
      typeChecker
    );
  }

  /**
   * Prepends the import declarations collected in `_hoistedTypeImports` to the
   * visited file and clears the collection for the next file.
   */
  protected insertHoistedTypeImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory
  ): ts.SourceFile {
    if (this._hoistedTypeImports.size === 0) {
      return sourceFile;
    }
    const importDeclarations = Array.from(this._hoistedTypeImports).map(
      ([importPath, namespaceName]) =>
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(
            false,
            undefined,
            factory.createNamespaceImport(
              factory.createIdentifier(namespaceName)
            )
          ),
          factory.createStringLiteral(importPath),
          undefined
        )
    );
    this._hoistedTypeImports.clear();
    return factory.updateSourceFile(sourceFile, [
      ...importDeclarations,
      ...sourceFile.statements
    ]);
  }

  protected registerOutputExtension(
    filePath: string,
    sourceFile: ts.SourceFile,
    options: PluginOptions
  ) {
    this._fileOutputExtensions[filePath] = options.esmCompatible
      ? getOutputExtension(sourceFile.fileName)
      : '';
  }

  /**
   * Builds the `import("...")` expression that the generated metadata file uses
   * to lazily load each visited file.
   */
  protected buildMetadataImports<T>(
    collectedMetadata: Record<string, T>
  ): Array<[ts.CallExpression, T]> {
    return Object.entries(collectedMetadata).map(([filePath, metadata]) => {
      const fileExt = this._fileOutputExtensions[filePath];
      const path = normalizePackagePath(
        filePath.replace(/\.[jt]s$/, fileExt ?? '')
      );
      const importExpr = ts.factory.createCallExpression(
        ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as ts.Expression,
        undefined,
        [ts.factory.createStringLiteral(path)]
      );
      return [importExpr, metadata];
    });
  }

  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined,
    program: ts.Program,
    options?: PluginOptions
  ): ts.SourceFile {
    if (major <= 4 && minor < 8) {
      throw new Error('Nest CLI plugin does not support TypeScript < v4.8');
    }
    const compilerOptions = program.getCompilerOptions();
    if (isEsmOutputFile(sourceFile, compilerOptions, options)) {
      const importAsDeclaration = (factory.createImportDeclaration as any)(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamespaceImport(
            factory.createIdentifier(OPENAPI_NAMESPACE)
          )
        ),
        factory.createStringLiteral(OPENAPI_PACKAGE_NAME),
        undefined
      );
      return factory.updateSourceFile(sourceFile, [
        importAsDeclaration,
        ...sourceFile.statements
      ]);
    } else {
      const importEqualsDeclaration: ts.ImportEqualsDeclaration =
        factory.createImportEqualsDeclaration(
          undefined,
          false,
          factory.createIdentifier(OPENAPI_NAMESPACE),
          factory.createExternalModuleReference(
            factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
          )
        );
      return factory.updateSourceFile(sourceFile, [
        importEqualsDeclaration,
        ...sourceFile.statements
      ]);
    }
  }
}

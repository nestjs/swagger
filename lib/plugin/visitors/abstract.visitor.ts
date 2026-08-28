import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants.js';
import { isEsmOutputFile } from '../utils/module-format.util.js';
import {
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

  /**
   * Hoists the modules referenced by the generated metadata into namespace
   * imports, so that those references can be resolved synchronously in ESM
   * output, where `require()` is not available.
   */
  protected prependEsmTypeImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory,
    typeImports: Record<string, string>
  ): ts.SourceFile {
    const importPaths = Object.keys(typeImports);
    if (!importPaths.length) {
      return sourceFile;
    }
    const importDeclarations = importPaths.map((importPath) =>
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamespaceImport(
            factory.createIdentifier(typeImports[importPath])
          )
        ),
        factory.createStringLiteral(importPath)
      )
    );
    return factory.updateSourceFile(sourceFile, [
      ...importDeclarations,
      ...sourceFile.statements
    ]);
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

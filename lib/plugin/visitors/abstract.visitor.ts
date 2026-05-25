import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants.js';
import { isEsmOutputFile } from '../utils/module-format.util.js';

const [major, minor] = ts.versionMajorMinor.split('.').map((x) => +x);

export class AbstractFileVisitor {
  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined,
    program: ts.Program,
    options?: PluginOptions
  ): ts.SourceFile {
    if (major <= 4 && minor < 8) {
      throw new Error('Nest CLI plugin does not support TypeScript < v4.8');
    }
    const importEqualsDeclaration: ts.ImportEqualsDeclaration =
      factory.createImportEqualsDeclaration(
        undefined,
        false,
        factory.createIdentifier(OPENAPI_NAMESPACE),
        factory.createExternalModuleReference(
          factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
        )
      );

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
      return factory.updateSourceFile(sourceFile, [
        importEqualsDeclaration,
        ...sourceFile.statements
      ]);
    }
  }
}

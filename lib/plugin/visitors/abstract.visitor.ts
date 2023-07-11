import * as ts from 'typescript';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants';

const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);

export class AbstractFileVisitor {
  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined,
    program: ts.Program
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
    if (
      compilerOptions.module >= ts.ModuleKind.ES2015 &&
      compilerOptions.module <= ts.ModuleKind.ESNext
    ) {
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

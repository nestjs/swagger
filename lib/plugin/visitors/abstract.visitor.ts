import * as ts from 'typescript';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants';

const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);
export class AbstractFileVisitor {
  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined,
    program: ts.Program
  ): ts.SourceFile {
    if (!factory) {
      // support TS v4.2+
      const importEqualsDeclaration =
        major == 4 && minor >= 2
          ? (ts.createImportEqualsDeclaration as any)(
              undefined,
              undefined,
              false,
              OPENAPI_NAMESPACE,
              ts.createExternalModuleReference(
                ts.createLiteral(OPENAPI_PACKAGE_NAME)
              )
            )
          : (ts.createImportEqualsDeclaration as any)(
              undefined,
              undefined,
              OPENAPI_NAMESPACE,
              ts.createExternalModuleReference(
                ts.createLiteral(OPENAPI_PACKAGE_NAME)
              )
            );
      return ts.updateSourceFileNode(sourceFile, [
        importEqualsDeclaration,
        ...sourceFile.statements
      ]);
    }
    // support TS v4.2+
    const importEqualsDeclaration: ts.ImportDeclaration =
      major >= 4 && minor >= 2
        ? minor >= 8
          ? (factory.createImportEqualsDeclaration as any)(
              undefined,
              false,
              factory.createIdentifier(OPENAPI_NAMESPACE),
              factory.createExternalModuleReference(
                factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
              )
            )
          : (factory.createImportEqualsDeclaration as any)(
              undefined,
              undefined,
              false,
              OPENAPI_NAMESPACE,
              factory.createExternalModuleReference(
                factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
              )
            )
        : (factory.createImportEqualsDeclaration as any)(
            undefined,
            undefined,
            OPENAPI_NAMESPACE,
            factory.createExternalModuleReference(
              factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
            )
          );

    const compilerOptions = program.getCompilerOptions();
    // Support TS v4.8+
    if (
      compilerOptions.module >= ts.ModuleKind.ES2015 &&
      compilerOptions.module <= ts.ModuleKind.ESNext
    ) {
      const importAsDeclaration =
        (minor >= 8 && major >= 4) || major >= 5
          ? (factory.createImportDeclaration as any)(
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
            )
          : (factory.createImportDeclaration as any)(
              undefined,
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

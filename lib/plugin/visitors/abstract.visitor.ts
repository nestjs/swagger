import * as ts from 'typescript';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants';

export class AbstractFileVisitor {
  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined
  ): ts.SourceFile {
    const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);
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
    const importEqualsDeclaration =
      major == 4 && minor >= 2
        ? (factory.createImportEqualsDeclaration as any)(
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

    return factory.updateSourceFile(sourceFile, [
      importEqualsDeclaration,
      ...sourceFile.statements
    ]);
  }
}

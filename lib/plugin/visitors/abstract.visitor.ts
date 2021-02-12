import * as ts from 'typescript';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants';

export class AbstractFileVisitor {
  updateImports(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory | undefined
  ): ts.SourceFile {
    if (!factory) {
      return ts.updateSourceFileNode(sourceFile, [
        ts.createImportEqualsDeclaration(
          undefined,
          undefined,
          OPENAPI_NAMESPACE,
          ts.createExternalModuleReference(
            ts.createLiteral(OPENAPI_PACKAGE_NAME)
          )
        ),
        ...sourceFile.statements
      ]);
    }
    return factory.updateSourceFile(sourceFile, [
      factory.createImportEqualsDeclaration(
        undefined,
        undefined,
        OPENAPI_NAMESPACE,
        factory.createExternalModuleReference(
          factory.createStringLiteral(OPENAPI_PACKAGE_NAME)
        )
      ),
      ...sourceFile.statements
    ]);
  }
}

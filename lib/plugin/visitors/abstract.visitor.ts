import { ts } from 'ts-morph';
import { OPENAPI_NAMESPACE, OPENAPI_PACKAGE_NAME } from '../plugin-constants';

export class AbstractFileVisitor {
  updateImports(sourceFile: ts.SourceFile): ts.SourceFile {
    return ts.updateSourceFileNode(sourceFile, [
      ts.createImportEqualsDeclaration(
        undefined,
        undefined,
        OPENAPI_NAMESPACE,
        ts.createExternalModuleReference(ts.createLiteral(OPENAPI_PACKAGE_NAME))
      ),
      ...sourceFile.statements
    ]);
  }
}

import * as ts from 'typescript';

export function getExternalImports(
  sourceFile: ts.SourceFile
): Record<string, string> {
  const externalImports: Record<string, string> = {};

  const importDeclarations = sourceFile.statements.filter(
    ts.isImportDeclaration
  );

  for (const declaration of importDeclarations) {
    const { moduleSpecifier, importClause } = declaration;

    // Skip relative imports
    if (
      !ts.isStringLiteral(moduleSpecifier) ||
      moduleSpecifier.text[0] === '.'
    ) {
      continue;
    }

    if (
      importClause?.namedBindings &&
      ts.isNamedImports(importClause.namedBindings)
    ) {
      const namedImports = importClause?.namedBindings as ts.NamedImports;
      for (const namedImport of namedImports.elements) {
        externalImports[namedImport.name.text] = moduleSpecifier.text;
      }
    }
  }
  return externalImports;
}

export function replaceExternalImportsInTypeReference(
  typeReference: string,
  externalImports: Record<string, string>
): string {
  const regexp = /import\((.+)\).([^\]]+)(\])?/;
  const match = regexp.exec(typeReference);

  if (match?.length >= 3) {
    const [, importPath, importName] = match;
    if (externalImports[importName]) {
      return typeReference.replace(
        importPath,
        `"${externalImports[importName]}"`
      );
    }
  }

  return typeReference;
}

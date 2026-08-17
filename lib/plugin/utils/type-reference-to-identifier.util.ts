import { posix } from 'path';
import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';
import { pluginDebugLogger } from '../plugin-debug-logger.js';
import {
  convertPath,
  getOutputExtension,
  replaceImportPath
} from './plugin-utils.js';

export function typeReferenceToIdentifier(
  typeReferenceDescriptor: {
    typeName: string;
    isArray?: boolean;
    arrayDepth?: number;
  },
  hostFilename: string,
  options: PluginOptions,
  factory: ts.NodeFactory,
  type: ts.Type,
  typeImports: Record<string, string>
) {
  if (options.readonly) {
    assertReferenceableType(
      type,
      typeReferenceDescriptor.typeName,
      hostFilename,
      options
    );
  }

  const { typeReference, importPath, typeName } = replaceImportPath(
    typeReferenceDescriptor.typeName,
    hostFilename,
    options
  );

  let identifier: ts.Identifier;
  if (options.readonly && typeReference?.includes('import')) {
    if (!typeImports[importPath]) {
      typeImports[importPath] = typeReference;
    }

    let ref = `t["${importPath}"].${typeName}`;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  } else if (
    options.readonly &&
    !typeReference?.includes('import') &&
    isSameFileUserType(type, hostFilename)
  ) {
    // Same-file type reference in readonly mode (SWC/metadata.ts generation).
    // The type is defined in the same file as the property that references it.
    // We must use the t["./path"].TypeName pattern instead of a bare identifier,
    // because bare identifiers are not in scope in the generated metadata.ts.
    const sameFileImportPath = buildSameFileImportPath(
      hostFilename,
      options
    );
    // Build a synthetic async import expression for the type imports map
    const syntheticImportRef = `await import("${sameFileImportPath}")`;
    if (!typeImports[sameFileImportPath]) {
      typeImports[sameFileImportPath] = syntheticImportRef;
    }

    let ref = `t["${sameFileImportPath}"].${typeReferenceDescriptor.typeName}`;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  } else {
    let ref = typeReference;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  }
  return identifier;
}

/**
 * Checks whether a type is a user-defined type declared in the same file
 * as hostFilename (as opposed to a built-in type like String, Number, etc.).
 */
function isSameFileUserType(type: ts.Type, hostFilename: string): boolean {
  if (!type.symbol || !type.symbol.declarations) {
    return false;
  }
  const normalizedHost = convertPath(hostFilename);
  return type.symbol.declarations.some((decl) => {
    const declFile = convertPath(decl.getSourceFile().fileName);
    return (
      declFile === normalizedHost && !decl.getSourceFile().isDeclarationFile
    );
  });
}

function buildSameFileImportPath(
  hostFilename: string,
  options: PluginOptions
): string {
  const from = convertPath(options.pathToSource);
  const to = convertPath(hostFilename).replace(/\.[jt]s$/, '');
  let relativePath = posix.relative(from, to);
  if (relativePath[0] !== '.') {
    relativePath = './' + relativePath;
  }
  if (options.esmCompatible) {
    relativePath += getOutputExtension(hostFilename);
  }
  return relativePath;
}

function wrapTypeInArray(typeRef: string, arrayDepth: number) {
  for (let i = 0; i < arrayDepth; i++) {
    typeRef = `[${typeRef}]`;
  }
  return typeRef;
}

function assertReferenceableType(
  type: ts.Type,
  parsedTypeName: string,
  hostFilename: string,
  options: PluginOptions
) {
  if (!type.symbol) {
    return true;
  }
  // Type comes from a different file (has import path) — always referenceable
  if (parsedTypeName.includes('import')) {
    return true;
  }
  // Check if this is a same-file user-defined type that isn't exported.
  // Built-in types (String, Number, Date, Object, etc.) are declared in .d.ts
  // files and should always pass. Only reject types that are declared in the
  // same host file but not exported.
  if (!isSameFileUserType(type, hostFilename)) {
    // Not a same-file type — it's either a built-in or from another file
    return true;
  }
  // Same-file type: check whether it is exported.
  const declarations =
    type.symbol.declarations ??
    (type.symbol.valueDeclaration
      ? [type.symbol.valueDeclaration]
      : []);
  const isExported = declarations.some((decl) => {
    if (!decl) return false;
    return (
      ts.canHaveModifiers(decl) &&
      ts.getModifiers(decl)?.some(
        (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
      )
    );
  });
  if (isExported) {
    // Exported same-file type — referenceable via t["./path"].TypeName
    return true;
  }
  // Not exported — not referenceable in metadata.ts
  const errorMessage = `Type "${parsedTypeName}" is not referenceable ("${hostFilename}"). To fix this, make sure to export this type.`;
  if (options.debug) {
    pluginDebugLogger.debug(errorMessage);
  }
  throw new Error(errorMessage);
}

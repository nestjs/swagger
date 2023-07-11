import * as ts from 'typescript';
import { PluginOptions } from '../merge-options';
import { pluginDebugLogger } from '../plugin-debug-logger';
import { replaceImportPath } from './plugin-utils';

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
  } else {
    let ref = typeReference;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  }
  return identifier;
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
  if (!(type.symbol as any).isReferenced) {
    return true;
  }
  if (parsedTypeName.includes('import')) {
    return true;
  }
  const errorMessage = `Type "${parsedTypeName}" is not referenceable ("${hostFilename}"). To fix this, make sure to export this type.`;
  if (options.debug) {
    pluginDebugLogger.debug(errorMessage);
  }
  throw new Error(errorMessage);
}

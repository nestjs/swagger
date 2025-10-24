"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeReferenceToIdentifier = typeReferenceToIdentifier;
const plugin_debug_logger_1 = require("../plugin-debug-logger");
const plugin_utils_1 = require("./plugin-utils");
function typeReferenceToIdentifier(typeReferenceDescriptor, hostFilename, options, factory, type, typeImports) {
    if (options.readonly) {
        assertReferenceableType(type, typeReferenceDescriptor.typeName, hostFilename, options);
    }
    const { typeReference, importPath, typeName } = (0, plugin_utils_1.replaceImportPath)(typeReferenceDescriptor.typeName, hostFilename, options);
    let identifier;
    if (options.readonly && (typeReference === null || typeReference === void 0 ? void 0 : typeReference.includes('import'))) {
        if (!typeImports[importPath]) {
            typeImports[importPath] = typeReference;
        }
        let ref = `t["${importPath}"].${typeName}`;
        if (typeReferenceDescriptor.isArray) {
            ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
        }
        identifier = factory.createIdentifier(ref);
    }
    else {
        let ref = typeReference;
        if (typeReferenceDescriptor.isArray) {
            ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
        }
        identifier = factory.createIdentifier(ref);
    }
    return identifier;
}
function wrapTypeInArray(typeRef, arrayDepth) {
    for (let i = 0; i < arrayDepth; i++) {
        typeRef = `[${typeRef}]`;
    }
    return typeRef;
}
function assertReferenceableType(type, parsedTypeName, hostFilename, options) {
    if (!type.symbol) {
        return true;
    }
    if (!type.symbol.isReferenced) {
        return true;
    }
    if (parsedTypeName.includes('import')) {
        return true;
    }
    const errorMessage = `Type "${parsedTypeName}" is not referenceable ("${hostFilename}"). To fix this, make sure to export this type.`;
    if (options.debug) {
        plugin_debug_logger_1.pluginDebugLogger.debug(errorMessage);
    }
    throw new Error(errorMessage);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractFileVisitor = void 0;
const ts = require("typescript");
const plugin_constants_1 = require("../plugin-constants");
const [major, minor] = ts.versionMajorMinor.split('.').map((x) => +x);
class AbstractFileVisitor {
    updateImports(sourceFile, factory, program) {
        if (major <= 4 && minor < 8) {
            throw new Error('Nest CLI plugin does not support TypeScript < v4.8');
        }
        const importEqualsDeclaration = factory.createImportEqualsDeclaration(undefined, false, factory.createIdentifier(plugin_constants_1.OPENAPI_NAMESPACE), factory.createExternalModuleReference(factory.createStringLiteral(plugin_constants_1.OPENAPI_PACKAGE_NAME)));
        const compilerOptions = program.getCompilerOptions();
        if (compilerOptions.module >= ts.ModuleKind.ES2015 &&
            compilerOptions.module <= ts.ModuleKind.ESNext) {
            const importAsDeclaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(plugin_constants_1.OPENAPI_NAMESPACE))), factory.createStringLiteral(plugin_constants_1.OPENAPI_PACKAGE_NAME), undefined);
            return factory.updateSourceFile(sourceFile, [
                importAsDeclaration,
                ...sourceFile.statements
            ]);
        }
        else {
            return factory.updateSourceFile(sourceFile, [
                importEqualsDeclaration,
                ...sourceFile.statements
            ]);
        }
    }
}
exports.AbstractFileVisitor = AbstractFileVisitor;

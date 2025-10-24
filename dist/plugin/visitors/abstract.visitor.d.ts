import * as ts from 'typescript';
export declare class AbstractFileVisitor {
    updateImports(sourceFile: ts.SourceFile, factory: ts.NodeFactory | undefined, program: ts.Program): ts.SourceFile;
}

import * as ts from 'typescript';
import { PluginOptions } from '../merge-options';
export declare class ReadonlyVisitor {
    private readonly options;
    readonly key = "@nestjs/swagger";
    private readonly modelClassVisitor;
    private readonly controllerClassVisitor;
    get typeImports(): {
        [x: string]: string;
    };
    constructor(options: PluginOptions);
    visit(program: ts.Program, sf: ts.SourceFile): ts.Node;
    collect(): {
        models: [ts.CallExpression, Record<string, {
            [x: string]: ts.ObjectLiteralExpression;
        }>][];
        controllers: [ts.CallExpression, Record<string, {
            [x: string]: ts.ObjectLiteralExpression;
        }>][];
    };
}

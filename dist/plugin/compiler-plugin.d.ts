import * as ts from 'typescript';
export declare const before: (options?: Record<string, any>, program?: ts.Program) => (ctx: ts.TransformationContext) => ts.Transformer<any>;

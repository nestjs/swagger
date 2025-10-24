import * as ts from 'typescript';
import { PluginOptions } from '../merge-options';
export declare function typeReferenceToIdentifier(typeReferenceDescriptor: {
    typeName: string;
    isArray?: boolean;
    arrayDepth?: number;
}, hostFilename: string, options: PluginOptions, factory: ts.NodeFactory, type: ts.Type, typeImports: Record<string, string>): ts.Identifier;

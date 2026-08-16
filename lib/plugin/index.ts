import type * as ts from 'typescript';
import { before } from './compiler-plugin.js';

export * from './compiler-plugin.js';
export * from './visitors/readonly.visitor.js';

/**
 * Compatibility with ts-patch/ttypescript, which invoke the default export
 * with the arguments in the reverse order of `before`.
 */
export default (program: ts.Program, options?: Record<string, any>) =>
  before(options, program);

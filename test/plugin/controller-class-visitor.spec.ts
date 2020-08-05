import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  appControllerText,
  appControllerTextTranspiled
} from './fixtures/app.controller';

describe('Controller methods', () => {
  it('should add response based on the return value', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ controllerKeyOfComment: 'summary' }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerTextTranspiled);
  });
});

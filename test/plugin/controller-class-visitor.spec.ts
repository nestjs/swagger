import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  appControllerText,
  appControllerTextTranspiled
} from './fixtures/app.controller';
import {
  appControllerWithTabsText,
  appControllerWithTabsTextTranspiled
} from './fixtures/app.controller-tabs';

describe('Controller methods', () => {
  it('should add response based on the return value (spaces)', () => {
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
        before: [
          before(
            { controllerKeyOfComment: 'summary', introspectComments: true },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(appControllerTextTranspiled);
  });

  it('should add response based on the return value (tabs)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerWithTabsText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { controllerKeyOfComment: 'summary', introspectComments: true },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(appControllerWithTabsTextTranspiled);
  });
});

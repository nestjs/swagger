import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  appControllerText,
  appControllerTextTranspiled
} from './fixtures/app.controller';

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ESNext,
  newLine: ts.NewLineKind.LineFeed,
  noEmitHelpers: true
}

const transpileModule = (filename, controllerText, compilerOptions, swaggerDocumentOptions = {}) => {
  const fakeProgram = ts.createProgram([filename], compilerOptions);

  return ts.transpileModule(controllerText, {
    compilerOptions,
    fileName: filename,
    transformers: {
      before: [
        before(
          {...swaggerDocumentOptions, introspectComments: true },
          fakeProgram
        )
      ]
    }
  })
}

describe('Controller methods', () => {
  it('Should generate summary property', () => {
    const result = transpileModule(
      'app.controller.ts',
      appControllerText,
      compilerOptions,
      {controllerKeyOfComment: 'summary'}
    );

    expect(result.outputText).toEqual(appControllerTextTranspiled);
  });
});

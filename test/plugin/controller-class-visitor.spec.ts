import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  appControllerText,
  appControllerTextTranspiled
} from './fixtures/app.controller';
import {
  enhancedCommentsControllerText,
  enhancedCommentsControllerTextTranspiled
} from './fixtures/enhanced-comments.controller';

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

  it('Should generate summary and description if no controllerKeyOfComments', () => {
    const result = transpileModule(
      'enhanced-comments.controller.ts',
      enhancedCommentsControllerText,
      compilerOptions,
      { controllerKeyOfComment: null }
    );
    expect(result.outputText).toEqual(enhancedCommentsControllerTextTranspiled);
  })
});

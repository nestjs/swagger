import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  appControllerText,
  appControllerTextTranspiled
} from './fixtures/app.controller';
import {
  appControllerApiResponseText,
  appControllerApiResponseTextTranspiled
} from './fixtures/app.controller-api-response';
import {
  appControllerErrorOnlyApiResponseText,
  appControllerErrorOnlyApiResponseTextTranspiled
} from './fixtures/app.controller-error-only-api-response';
import {
  appControllerWithTabsText,
  appControllerWithTabsTextTranspiled
} from './fixtures/app.controller-tabs';
import {
  appControllerWithoutModifiersText,
  appControllerWithoutModifiersTextTranspiled
} from './fixtures/app.controller-without-modifiers';

describe('Controller methods', () => {
  it('should add response based on the return value (spaces)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerTextTranspiled);
  });

  it('should add response based on the return value (tabs)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerWithTabsText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerWithTabsTextTranspiled);
  });

  it('should not add a default response when an explicit non-error (2xx/3xx) Api*Response decorator is present (issue #1639)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerApiResponseText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerApiResponseTextTranspiled);
  });

  it('should still add the default 2xx response when only error Api*Response decorators are present (issue #3862)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerErrorOnlyApiResponseText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(
      appControllerErrorOnlyApiResponseTextTranspiled
    );
  });

  it('should add response based on the return value (without modifiers)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerWithoutModifiersText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(
      appControllerWithoutModifiersTextTranspiled
    );
  });
});

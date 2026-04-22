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
  appControllerWithTabsText,
  appControllerWithTabsTextTranspiled
} from './fixtures/app.controller-tabs';
import {
  appControllerOptionalQueryText,
  appControllerOptionalQueryTextTranspiled
} from './fixtures/app.controller-optional-query';
import {
  appControllerWithoutModifiersText,
  appControllerWithoutModifiersTextTranspiled
} from './fixtures/app.controller-without-modifiers';
import {
  appControllerThrowsQuotesText,
  appControllerThrowsQuotesTextTranspiled
} from './fixtures/app.controller-throws-quotes';
import {
  appControllerApiOperationDedupeText,
  appControllerApiOperationDedupeTextTranspiled
} from './fixtures/app.controller-api-operation-dedupe';

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

  it('should not add a default response when explicit Api*Response decorator is present (issue #1639)', () => {
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

  it('should mark optional @Query parameters as required: false (issue #30)', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerOptionalQueryText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerOptionalQueryTextTranspiled);
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

  it('should emit a valid string literal for @throws descriptions that contain quotes', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerThrowsQuotesText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(appControllerThrowsQuotesTextTranspiled);
  });

  it('should not emit duplicate keys when user has supplied controllerKeyOfComment already', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true
    };
    const filename = 'app.controller.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(appControllerApiOperationDedupeText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(
      appControllerApiOperationDedupeTextTranspiled
    );
  });
});

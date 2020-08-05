import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  createCatDtoAltText,
  createCatDtoTextAltTranspiled
} from './fixtures/create-cat-alt.dto';
import {
  createCatDtoAlt2Text,
  createCatDtoTextAlt2Transpiled
} from './fixtures/create-cat-alt2.dto';
import {
  createCatDtoText,
  createCatDtoTextTranspiled
} from './fixtures/create-cat.dto';
import {
  es5CreateCatDtoText,
  es5CreateCatDtoTextTranspiled
} from './fixtures/es5-class.dto';

describe('API model properties', () => {
  it('should add the metadata factory when no decorators exist, and generated propertyKey is title', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true
    };
    const filename = 'create-cat.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { classValidatorShim: true, dtoKeyOfComment: 'title' },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextTranspiled);
  });

  it('should add partial metadata factory when some decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true
    };
    const filename = 'create-cat.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoAltText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({}, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextAltTranspiled);
  });

  it('should add partial metadata factory when some decorators exist when exist node without type', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true
    };
    const filename = 'create-cat-alt2.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoAlt2Text, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ classValidatorShim: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextAlt2Transpiled);
  });

  it('should manage imports statements when code "downleveled"', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      strict: true
    };
    const filename = 'es5-class.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(es5CreateCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ classValidatorShim: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(es5CreateCatDtoTextTranspiled);
  });
});

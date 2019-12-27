import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  createCatDtoAltText,
  createCatDtoTextAltTranspiled
} from './fixtures/create-cat-alt.dto';
import {
  createCatDtoText,
  createCatDtoTextTranspiled
} from './fixtures/create-cat.dto';

describe('API model properties', () => {
  it('should add the metadata factory when no decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noEmitHelpers: true
    };
    const filename = 'create-cat.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ classValidatorShim: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextTranspiled);
  });

  it('should add partial metadata factory when some decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      noEmitHelpers: true
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
});

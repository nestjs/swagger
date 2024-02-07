import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import {
  changedCatDtoText,
  changedCatDtoTextTranspiled,
  originalCatDtoText
} from './fixtures/changed-class.dto';
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
  es5CreateCatDtoTextTranspiled,
  es5CreateCatDtoTextTranspiledV5
} from './fixtures/es5-class.dto';
import {
  nullableDtoText,
  nullableDtoTextTranspiled
} from './fixtures/nullable.dto';
import {
  stringLiteralDtoText,
  stringLiteralDtoTextTranspiled
} from './fixtures/string-literal.dto';
import {
  parameterPropertyDtoText,
  parameterPropertyDtoTextTranspiled
} from './fixtures/parameter-property.dto';
import {
  createCatExcludeDtoText,
  createCatExcludeDtoTextTranspiled,
  createCatIgnoreExcludeDtoTextTranspiled
} from './fixtures/create-cat-exclude.dto';
import {
  createCatExclusiveDtoText,
  createCatExclusiveDtoTextTranspiled
} from './fixtures/create-cat-exclusive.dto';
import {
  createCatPriorityDtoText,
  createCatPriorityDtoTextTranspiled
} from './fixtures/create-cat-priority.dto';
import { pluginDebugLogger } from '../../lib/plugin/plugin-debug-logger';

describe('API model properties', () => {
  it('should add the metadata factory when no decorators exist, and generated propertyKey is title', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
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
            {
              classValidatorShim: true,
              dtoKeyOfComment: 'title',
              introspectComments: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextTranspiled);
  });

  it('should add partial metadata factory when some decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoAltText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [before({ introspectComments: true }, fakeProgram)]
      }
    });
    expect(result.outputText).toEqual(createCatDtoTextAltTranspiled);
  });

  it('should add partial metadata factory when some decorators exist when exist node without type', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat-alt2.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatDtoAlt2Text, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
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
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'es5-class.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(es5CreateCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
      }
    });

    const [tsVersionMajor] = ts.versionMajorMinor?.split('.').map((x) => +x);

    if (tsVersionMajor === 5) {
      expect(result.outputText).toEqual(es5CreateCatDtoTextTranspiledV5);
    } else {
      expect(result.outputText).toEqual(es5CreateCatDtoTextTranspiled);
    }
  });

  it('should support & understand nullable type unions', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'nullable.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(nullableDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(nullableDtoTextTranspiled);
  });

  it('should remove properties from metadata when properties removed from dto', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'changed-class.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    ts.transpileModule(originalCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
      }
    });

    const changedResult = ts.transpileModule(changedCatDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
      }
    });

    expect(changedResult.outputText).toEqual(changedCatDtoTextTranspiled);
  });

  it('should support & understand string literals', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'string-literal.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(stringLiteralDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            { introspectComments: true, classValidatorShim: true },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(stringLiteralDtoTextTranspiled);
  });

  it('should support & understand parameter properties', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'parameter-property.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(parameterPropertyDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              introspectComments: true,
              classValidatorShim: true,
              parameterProperties: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(parameterPropertyDtoTextTranspiled);
  });

  it('should ignore Exclude decorator', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat-exclude.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatExcludeDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              classValidatorShim: true,
              classTransformerShim: false,
              dtoKeyOfComment: 'title',
              introspectComments: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatIgnoreExcludeDtoTextTranspiled);
  });

  it('should hide properties decorated with the Exclude decorator', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat-exclude.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatExcludeDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              classValidatorShim: true,
              classTransformerShim: true,
              dtoKeyOfComment: 'title',
              introspectComments: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatExcludeDtoTextTranspiled);
  });

  it('should hide a property with conflicting decorators', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat-priority.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const debugLoggerSpy = jest.spyOn(pluginDebugLogger, 'debug');

    const result = ts.transpileModule(createCatPriorityDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              classValidatorShim: true,
              classTransformerShim: true,
              dtoKeyOfComment: 'title',
              introspectComments: true,
              debug: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatPriorityDtoTextTranspiled);
    expect(debugLoggerSpy).toHaveBeenCalledWith(
      '"CreateCatDto->hidden" has conflicting decorators, excluding as @ApiHideProperty() takes priority.'
    );
  });

  it('should add the metadata factory only when decorators exist', () => {
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      newLine: ts.NewLineKind.LineFeed,
      noEmitHelpers: true,
      experimentalDecorators: true,
      strict: true
    };
    const filename = 'create-cat-exclusive.dto.ts';
    const fakeProgram = ts.createProgram([filename], options);

    const result = ts.transpileModule(createCatExclusiveDtoText, {
      compilerOptions: options,
      fileName: filename,
      transformers: {
        before: [
          before(
            {
              classValidatorShim: true,
              classTransformerShim: 'exclusive',
              dtoKeyOfComment: 'title',
              introspectComments: true
            },
            fakeProgram
          )
        ]
      }
    });
    expect(result.outputText).toEqual(createCatExclusiveDtoTextTranspiled);
  });
});

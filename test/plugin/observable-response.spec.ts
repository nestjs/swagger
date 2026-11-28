import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';

// The controller imports `Observable` from 'rxjs' and returns
// `Observable<CatDto[]>`. The response type is `CatDto`, so its import must be
// resolved from `CatDto`'s declaration, not from the 'rxjs' specifier the
// source file uses for the `Observable` wrapper.
const projectDir = join(__dirname, 'fixtures', 'observable-response');

function transpileFixture(compilerOptionsOverrides: ts.CompilerOptions = {}) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    join(projectDir, 'tsconfig.json'),
    compilerOptionsOverrides,
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames });

  const sourceFile = program.getSourceFile(
    join(projectDir, 'src', 'cats.controller.ts')
  )!;

  let output = '';
  program.emit(
    sourceFile,
    (_fileName, text) => {
      output = text;
    },
    undefined,
    false,
    { before: [before({}, program)] }
  );
  return output;
}

describe('CLI plugin with an Observable response type', () => {
  it('should import the response type from its declaration file', () => {
    const output = transpileFixture();

    expect(output).toContain('type: [require("./cat.dto").CatDto]');
    expect(output).toContain('type: require("./cat.dto").CatDto');
    expect(output).not.toContain('require("rxjs").CatDto');
  });

  it('should resolve an Observable nested in a Promise', () => {
    const output = transpileFixture();

    expect(output).toMatch(
      /'nested'\),\s+openapi\.ApiResponse\(\{ status: 200, type: require\("\.\/cat\.dto"\)\.CatDto \}\)/
    );
  });

  it('should hoist the response type import from its declaration file in esm', () => {
    const output = transpileFixture({
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler
    });

    expect(output).toMatch(
      /import \* as (openapi_import_\d+) from "\.\/cat\.dto(\.js)?";/
    );
    expect(output).not.toMatch(/import \* as openapi_import_\d+ from "rxjs"/);
  });
});

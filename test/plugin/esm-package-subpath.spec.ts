import { execFileSync } from 'node:child_process';
import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';

// Fixture layout (tsconfig: module/moduleResolution "nodenext"):
//   src/booking.dto.ts   imports a type from each package below
//   node_modules/plain-pkg   no "exports"; the type is declared in a subpath
//                            the DTO reaches through a re-export
//   node_modules/mts-pkg     no "exports"; an enum and a class declared in .d.mts
//   node_modules/index-pkg   no "exports"; the type is declared in index.d.ts
//
// Under ESM, a subpath of a package without an "exports" map only resolves
// with the extension its file carries, while a package root resolves through
// "main" and must stay extensionless.
const projectDir = join(__dirname, 'fixtures', 'esm-packages');

function transpileFixture() {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    join(projectDir, 'tsconfig.json'),
    {},
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames });

  const sourceFile = program.getSourceFile(
    join(projectDir, 'src', 'booking.dto.ts')
  )!;

  let output = '';
  program.emit(
    sourceFile,
    (_fileName, text) => {
      output = text;
    },
    undefined,
    false,
    {
      before: [
        before({ dtoFileNameSuffix: ['.dto.ts'], esmCompatible: true }, program)
      ]
    }
  );
  return output;
}

function hoistedSpecifiers(output: string) {
  return [
    ...output.matchAll(/import \* as openapi_import_\d+ from "([^"]+)"/g)
  ].map((match) => match[1]);
}

describe('CLI plugin with a type declared in a package subpath under ESM', () => {
  it('should give a subpath the extension its file carries', () => {
    const output = transpileFixture();

    expect(hoistedSpecifiers(output)).toContain('plain-pkg/out/status.js');
  });

  it('should take the extension from a .d.mts declaration', () => {
    const output = transpileFixture();

    expect(hoistedSpecifiers(output)).toContain('mts-pkg/out/status.mjs');
  });

  it('should take the extension of an array element from its own declaration', () => {
    // `Cabin[]` carries the `Array<T>` type declared in lib.es5.d.ts, which
    // would yield ".js"; the element is declared in a .d.mts.
    const output = transpileFixture();

    expect(hoistedSpecifiers(output)).toContain('mts-pkg/out/cabin.mjs');
  });

  it('should keep a package root extensionless', () => {
    const output = transpileFixture();

    expect(hoistedSpecifiers(output)).toContain('index-pkg');
  });

  it('should emit specifiers that resolve in plain Node', () => {
    // Runs outside the test runner, whose module resolution differs from
    // Node's, from the directory the emitted file would live in.
    const specifiers = hoistedSpecifiers(transpileFixture());
    expect(specifiers).toHaveLength(4);

    const script = specifiers
      .map((specifier) => `await import(${JSON.stringify(specifier)});`)
      .join('\n');
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: join(projectDir, 'src'),
        stdio: 'pipe'
      })
    ).not.toThrow();
  });
});

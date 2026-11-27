import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';

// Fixture layout (tsconfig: rootDir="./app/src", outDir="./app/dist"):
//   app/src/item.dto.ts               imports ItemStatus from '@fixture/shared/messages'
//   app/src/cjs/item.dto.ts           the same, from a commonjs package
//   app/src/active-item.dto.ts        types a property with one member of ItemStatus
//   shared/build/messages/entry.d.ts   re-exports './item.js'
//   shared/build/messages/item.d.ts    declares ItemStatus
//
// The package is reached through a tsconfig "paths" mapping, which produces
// the same shape a workspace package has once TypeScript has resolved it: the
// type is found in the file that *declares* it, outside the project's rootDir
// and without passing through node_modules. A symlinked workspace package
// resolves identically, because TypeScript follows the link to the real path,
// so `normalizePackagePath` has no node_modules segment to fold back into a
// package specifier.
const projectDir = join(__dirname, 'fixtures', 'workspace-package');
const packageSpecifier = '@fixture/shared/messages';

function transpileFixture(
  compilerOptionsOverrides: ts.CompilerOptions = {},
  dtoFileName = 'item.dto.ts'
) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    join(projectDir, 'tsconfig.json'),
    compilerOptionsOverrides,
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames });

  const sourceFile = program.getSourceFile(
    join(projectDir, 'app', 'src', dtoFileName)
  )!;

  let output = '';
  program.emit(
    sourceFile,
    (_fileName, text) => {
      output = text;
    },
    undefined,
    false,
    { before: [before({ dtoFileNameSuffix: ['.dto.ts'] }, program)] }
  );
  return output;
}

describe('CLI plugin with a type imported from a workspace package', () => {
  it('should hoist the import under the specifier the source file uses', () => {
    const output = transpileFixture();

    expect(output).toContain(`import * as openapi_import_1 from "${packageSpecifier}"`);
    expect(output).toContain('enum: openapi_import_1.ItemStatus');
  });

  it('should not reach into the producing package with a filesystem path', () => {
    // The path emitted here before only resolved while the output stayed at
    // its original offset on disk, so the application stopped starting as soon
    // as it was deployed without its sibling packages at the same offset.
    const output = transpileFixture();

    expect(output).not.toContain('shared/build/messages/item');
    expect(output).not.toMatch(/\.\.\/\.\.\//);
  });

  it('should import an enum member through the specifier of its enum', () => {
    const output = transpileFixture({}, 'active-item.dto.ts');

    expect(output).toContain(
      `import * as openapi_import_1 from "${packageSpecifier}"`
    );
    expect(output).toContain('enum: [openapi_import_1.ItemStatus.ACTIVE]');
    expect(output).not.toContain('shared/build/messages/item');
  });

  it('should emit a valid require from a commonjs file', () => {
    // The package is esm, so TypeScript adds a resolution-mode attribute to
    // the type reference, whatever format the visited file is.
    const output = transpileFixture({}, join('cjs', 'item.dto.ts'));

    expect(output).toContain(`enum: require("${packageSpecifier}").ItemStatus`);
  });

  describe('when the package exports the type under another name', () => {
    // entry.d.ts exports the class declared as `Profile` in profile.dto.d.ts
    // as `PublicProfile`, another class as `Profile`, the class declared as
    // `Member` as `Account`, and the `ItemStatus` enum as `Status`.
    it('should reference the name the package exports it under', () => {
      const output = transpileFixture({}, 'account.dto.ts');

      expect(output).toContain(
        `import * as openapi_import_1 from "${packageSpecifier}"`
      );
      expect(output).toContain('type: () => openapi_import_1.PublicProfile');
      expect(output).toContain('type: () => [openapi_import_1.Account]');
      expect(output).toContain('enum: [openapi_import_1.Status.ACTIVE]');
      expect(output).not.toContain('openapi_import_1.Profile');
      expect(output).not.toContain('openapi_import_1.Member');
    });

    it('should reference the name the package exports it under from a commonjs file', () => {
      const output = transpileFixture({}, join('cjs', 'account.dto.ts'));

      expect(output).toContain(
        `type: () => require("${packageSpecifier}").PublicProfile`
      );
      expect(output).toContain(
        `type: () => [require("${packageSpecifier}").Account]`
      );
      expect(output).toContain(
        `enum: [require("${packageSpecifier}").Status.ACTIVE]`
      );
    });
  });
});

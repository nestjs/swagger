import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';

// Fixture layout (tsconfig: module/moduleResolution "nodenext"):
//   src/user.dto.ts      exports classes, an enum and a namespace under names
//                        other than the ones they are declared with, next to
//                        a default class and a non-exported class `User`
//   src/account.dto.ts   augments a class imported from account.entity.ts
//
// An export name is a property of the module, not a binding inside the file
// that declares it, so a same-file type is referenced by its declared name.
const projectDir = join(__dirname, 'fixtures', 'esm-export-alias');

function transpileFixture(fileName: string) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    join(projectDir, 'tsconfig.json'),
    {},
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames });

  const sourceFile = program.getSourceFile(join(projectDir, 'src', fileName))!;

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

describe('CLI plugin with a same-file type exported under another name (ESM)', () => {
  it('should reference a class by the name it is declared with', () => {
    const output = transpileFixture('user.dto.ts');

    expect(output).toContain(
      'items: { required: true, type: () => [PublicUser] }'
    );
    expect(output).toContain('owner: { required: true, type: () => User }');
    expect(output).toContain('shown: { required: true, type: () => Pub }');
    expect(output).not.toContain('openapi_import_');
  });

  it('should reference an enum and a namespace member by their declared names', () => {
    const output = transpileFixture('user.dto.ts');

    expect(output).toContain('enum: AccountState }');
    expect(output).toContain('enum: [AccountState.CLOSED]');
    expect(output).toContain('type: () => Internal.AuditDto');
  });

  it('should reference a default export by its class name', () => {
    const output = transpileFixture('user.dto.ts');

    expect(output).toContain('type: () => ProfileDto');
    const emittedFile = ts.createSourceFile(
      'user.dto.js',
      output,
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.JS
    );
    expect((emittedFile as any).parseDiagnostics).toEqual([]);
  });

  it('should import a type the file only augments', () => {
    const output = transpileFixture('account.dto.ts');

    expect(output).toContain(
      'import * as openapi_import_1 from "./account.entity.js";'
    );
    expect(output).toContain('type: () => [openapi_import_1.Account]');
  });
});

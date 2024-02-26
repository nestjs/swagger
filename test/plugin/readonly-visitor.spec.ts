import { readFileSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';
import { PluginMetadataPrinter } from './helpers/metadata-printer';

function createTsProgram(tsconfigPath: string) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames, projectReferences } = parsedCmd!;
  const program = ts.createProgram({ options, rootNames, projectReferences });
  return program;
}

describe('Readonly visitor', () => {
  const visitor = new ReadonlyVisitor({
    pathToSource: join(__dirname, 'fixtures', 'project'),
    introspectComments: true,
    dtoFileNameSuffix: ['.dto.ts', '.model.ts', '.class.ts'],
    classValidatorShim: true,
    debug: true
  });
  const metadataPrinter = new PluginMetadataPrinter();

  it('should generate a serialized metadata', () => {
    const tsconfigPath = join(
      __dirname,
      'fixtures',
      'project',
      'tsconfig.json'
    );
    const program = createTsProgram(tsconfigPath);

    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        visitor.visit(program, sourceFile);
      }
    }

    const result = metadataPrinter.print(
      {
        [visitor.key]: visitor.collect()
      },
      visitor.typeImports
    );

    const expectedOutput = readFileSync(
      join(__dirname, 'fixtures', 'serialized-meta.fixture.ts'),
      'utf-8'
    )
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    /** Normalize the file line endings to LF */

    // writeFileSync(
    //   join(__dirname, 'fixtures', 'serialized-meta.fixture.ts'),
    //   result,
    //   'utf-8'
    // );

    expect(result).toEqual(expectedOutput);
  });
});

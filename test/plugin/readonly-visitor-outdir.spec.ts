import { join } from 'path';
import * as ts from 'typescript';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';

function createTsProgram(tsconfigPath: string) {
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const { options, fileNames: rootNames } = parsedCmd!;
  return ts.createProgram({ options, rootNames });
}

describe('ReadonlyVisitor with outDir deeper than rootDir', () => {
  // Fixture layout (tsconfig: rootDir=".", outDir="./dist"):
  //   src/nested/nested.dto.ts  -> imports SharedDto from '../../../shared-lib/shared.dto'
  //
  // shared-lib/ lives OUTSIDE the project's rootDir, so the import target is
  // never remapped through outDir/rootDir (that remap only applies to imports
  // within rootDir). That isolates the readonly `from` computation: a fixture
  // where the import target also stays within rootDir gets rebased on both
  // sides by the same amount, so a broken (un-rebased) `from` and a fixed one
  // produce the identical relative path - the bug cancels itself out.
  const projectDir = join(__dirname, 'fixtures', 'readonly-outdir');
  const tsconfigPath = join(projectDir, 'tsconfig.json');

  // metadata.ts is generated at pathToSource ("src", mirroring where a real
  // project emits it before compilation) and must be rebased through
  // outDir/rootDir just like every other compiled file, or the generated
  // import ends up at the wrong "../" depth and breaks at runtime.
  const CORRECT_IMPORT_PATH = '../../../shared-lib/shared.dto';

  it('should generate metadata import paths rebased to outDir, matching the fixed depth', () => {
    const program = createTsProgram(tsconfigPath);

    // outDir/rootDir are intentionally NOT passed here: they must be
    // auto-derived from the ts.Program's compiler options, mirroring
    // compiler-plugin.ts's before() hook.
    const visitor = new ReadonlyVisitor({
      pathToSource: join(projectDir, 'src'),
      dtoFileNameSuffix: ['.dto.ts']
    });

    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        visitor.visit(program, sourceFile);
      }
    }

    const importPaths = Object.keys(visitor.typeImports);
    expect(importPaths).toEqual([CORRECT_IMPORT_PATH]);
  });

  it('should not override an explicit outDir/rootDir with the program compiler options', () => {
    const program = createTsProgram(tsconfigPath);

    // Explicit rootDir === pathToSource (0 segments to rebase) and a
    // differently-named outDir. If honored, the result has one fewer "../"
    // than the tsconfig-derived depth (outDir="./dist", rootDir="." => 1
    // segment "src" to rebase); if the caller's options get silently
    // overwritten by the program's compilerOptions, the result reverts to
    // the tsconfig-derived depth instead.
    const visitor = new ReadonlyVisitor({
      pathToSource: join(projectDir, 'src'),
      dtoFileNameSuffix: ['.dto.ts'],
      outDir: join(projectDir, 'explicit-dist'),
      rootDir: join(projectDir, 'src')
    });

    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        visitor.visit(program, sourceFile);
      }
    }

    const importPaths = Object.keys(visitor.typeImports);
    expect(importPaths).toEqual(['../../shared-lib/shared.dto']);
  });
});

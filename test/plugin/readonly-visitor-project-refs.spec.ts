import { join } from 'path';
import * as ts from 'typescript';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';

const APP_TSCONFIG = join(
  __dirname,
  'fixtures',
  'project-references',
  'app',
  'tsconfig.json'
);

describe('ReadonlyVisitor with TypeScript project references', () => {
  describe('ReadonlyVisitor.createTsProgram', () => {
    it('should create a program without TS6305 errors when referenced composite projects have not been built', () => {
      // Verify no pre-built output exists for the referenced project so the test
      // actually exercises the fix.
      const sharedDistIndex = join(
        __dirname,
        'fixtures',
        'project-references',
        'libs',
        'shared',
        'dist',
        'shared.dto.d.ts'
      );
      expect(ts.sys.fileExists(sharedDistIndex)).toBe(false);

      // Before the fix, the common pattern of passing `projectReferences` to
      // `ts.createProgram` caused TS6305 when referenced composite projects
      // had not been pre-built. Verify the old pattern does produce TS6305 to
      // confirm the fixture correctly reproduces the bug.
      const parsedCmd = ts.getParsedCommandLineOfConfigFile(
        APP_TSCONFIG,
        undefined,
        ts.sys as unknown as ts.ParseConfigFileHost
      );
      expect(parsedCmd).toBeDefined();
      const { options, fileNames: rootNames, projectReferences } = parsedCmd!;
      expect(projectReferences).toBeDefined();
      expect(projectReferences!.length).toBeGreaterThan(0);

      const buggyProgram = ts.createProgram({ options, rootNames, projectReferences });
      const buggyDiags = ts.getPreEmitDiagnostics(buggyProgram);
      const ts6305Errors = buggyDiags.filter((d) => d.code === 6305);
      expect(ts6305Errors.length).toBeGreaterThan(0);

      // The fix: use ReadonlyVisitor.createTsProgram which resolves project
      // reference source files directly, avoiding the TS6305 error.
      const program = ReadonlyVisitor.createTsProgram(APP_TSCONFIG);
      const diagnostics = ts.getPreEmitDiagnostics(program);
      const fixedTs6305Errors = diagnostics.filter((d) => d.code === 6305);

      expect(fixedTs6305Errors.length).toBe(0);
    });

    it('should include source files from referenced projects in the program', () => {
      const program = ReadonlyVisitor.createTsProgram(APP_TSCONFIG);

      const sourceFileNames = program
        .getSourceFiles()
        .filter((sf) => !sf.isDeclarationFile)
        .map((sf) => sf.fileName.replace(/\\/g, '/'));

      // The app source file must be present
      expect(
        sourceFileNames.some((f) => f.includes('app.dto.ts'))
      ).toBe(true);

      // The referenced project's source file must also be present
      expect(
        sourceFileNames.some((f) => f.includes('shared.dto.ts'))
      ).toBe(true);
    });

    it('should preserve type information from referenced project source files', () => {
      const program = ReadonlyVisitor.createTsProgram(APP_TSCONFIG);
      const checker = program.getTypeChecker();

      const appSourceFile = program
        .getSourceFiles()
        .find((sf) => !sf.isDeclarationFile && sf.fileName.includes('app.dto.ts'));

      expect(appSourceFile).toBeDefined();

      let sharedPropertyType: string | undefined;
      appSourceFile!.forEachChild((node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'AppDto') {
          node.members.forEach((member) => {
            if (
              ts.isPropertyDeclaration(member) &&
              ts.isIdentifier(member.name) &&
              member.name.text === 'shared'
            ) {
              const type = checker.getTypeAtLocation(member);
              sharedPropertyType = checker.typeToString(type);
            }
          });
        }
      });

      // Type info from the referenced project should be resolvable
      expect(sharedPropertyType).toBe('SharedDto');
    });

    it('should handle a tsconfig without project references', () => {
      const plainTsconfig = join(
        __dirname,
        'fixtures',
        'project',
        'tsconfig.json'
      );

      const program = ReadonlyVisitor.createTsProgram(plainTsconfig);
      expect(program).toBeDefined();
    }, 30000);

    it('should throw when tsconfig path does not exist', () => {
      const nonExistentPath = join(
        __dirname,
        'fixtures',
        'non-existent-tsconfig.json'
      );
      expect(() => ReadonlyVisitor.createTsProgram(nonExistentPath)).toThrow();
    });
  });
});

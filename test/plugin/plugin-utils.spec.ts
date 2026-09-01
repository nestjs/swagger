import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import {
  collectSourceImportSpecifiers,
  convertPath,
  replaceImportPath,
  safeDecodeURIComponent
} from '../../lib/plugin/utils/plugin-utils';

describe('collectSourceImportSpecifiers', () => {
  function collect(sourceText: string) {
    const fileName = '/repo/apps/api/src/items/item.dto.ts';
    const host = ts.createCompilerHost({});
    const originalGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, ...rest) =>
      name === fileName
        ? ts.createSourceFile(name, sourceText, languageVersion, true)
        : originalGetSourceFile(name, languageVersion, ...rest);
    host.fileExists = (name) => name === fileName;
    host.readFile = (name) => (name === fileName ? sourceText : undefined);

    const program = ts.createProgram([fileName], {}, host);
    const sourceFile = program.getSourceFile(fileName)!;
    return {
      specifiers: collectSourceImportSpecifiers(
        sourceFile,
        program.getTypeChecker()
      ),
      sourceFile
    };
  }

  it('should collect a named import from a package specifier', () => {
    const { specifiers } = collect(
      `import { ItemStatus } from '@repo/shared/messages';\nexport class ItemDto { status: ItemStatus; }`
    );

    expect([...specifiers.values()]).toEqual(['@repo/shared/messages']);
  });

  it('should ignore relative imports, which are rebased onto the output directory anyway', () => {
    const { specifiers } = collect(
      `import { ItemStatus } from './item-status';\nexport class ItemDto { status: ItemStatus; }`
    );

    expect(specifiers.size).toBe(0);
  });

  it('should ignore namespace imports, which resolve to the module rather than a type', () => {
    const { specifiers } = collect(
      `import * as shared from '@repo/shared/messages';\nexport class ItemDto { status: shared.ItemStatus; }`
    );

    expect(specifiers.size).toBe(0);
  });
});

describe('plugin-utils', () => {
  describe('convertPath', () => {
    it('should convert Windows backslashes to posix forward slashes', () => {
      expect(convertPath('C:\\Users\\test\\project\\src\\app.ts')).toBe(
        'C:/Users/test/project/src/app.ts'
      );
    });

    it('should collapse multiple slashes', () => {
      expect(convertPath('/mnt//Data//project')).toBe('/mnt/Data/project');
    });

    it('should pass through paths with non-ASCII characters unchanged', () => {
      expect(
        convertPath('/mnt/Data/testnéstcli/testcli/src/dto/test.dto')
      ).toBe('/mnt/Data/testnéstcli/testcli/src/dto/test.dto');
    });
  });

  describe('safeDecodeURIComponent', () => {
    it('should decode URL-encoded non-ASCII characters', () => {
      expect(
        safeDecodeURIComponent(
          '/mnt/Data/testn%C3%A9stcli/testcli/src/dto/test.dto'
        )
      ).toBe('/mnt/Data/testnéstcli/testcli/src/dto/test.dto');
    });

    it('should return the original string if already decoded', () => {
      expect(
        safeDecodeURIComponent(
          '/mnt/Data/testnéstcli/testcli/src/dto/test.dto'
        )
      ).toBe('/mnt/Data/testnéstcli/testcli/src/dto/test.dto');
    });

    it('should decode CJK characters', () => {
      expect(
        safeDecodeURIComponent('/home/%E4%B8%AD%E6%96%87/project/src/app.ts')
      ).toBe('/home/\u4e2d\u6587/project/src/app.ts');
    });

    it('should not throw on invalid percent sequences', () => {
      expect(safeDecodeURIComponent('/mnt/Data/100%/src/app.ts')).toBe(
        '/mnt/Data/100%/src/app.ts'
      );
    });
  });

  describe('replaceImportPath', () => {
    it('should keep the package specifier the source file imports the type through', () => {
      // A workspace package: TypeScript resolved the type to the file that
      // declares it, which sits outside the project and is reached without
      // passing through node_modules.
      const typeReference =
        'import("/repo/packages/shared/dist/messages/item").ItemStatus';
      const fileName = '/repo/apps/api/src/items/item.dto.ts';

      const result = replaceImportPath(
        typeReference,
        fileName,
        {},
        '@repo/shared/messages'
      );

      expect(result.typeReference).toBe(
        'require("@repo/shared/messages").ItemStatus'
      );
      expect(result.importPath).toBe('@repo/shared/messages');
    });

    it('should keep the package specifier without appending a file extension in esm output', () => {
      const typeReference =
        'import("/repo/packages/shared/dist/messages/item").ItemStatus';
      const fileName = '/repo/apps/api/src/items/item.dto.ts';

      const result = replaceImportPath(typeReference, fileName, {
        esmCompatible: true
      }, '@repo/shared/messages');

      expect(result.importPath).toBe('@repo/shared/messages');
      expect(result.typeReference).not.toContain('.js');
    });

    it('should still fold a node_modules path into its package name, ignoring the source specifier', () => {
      // node_modules paths already carry the package name, and the subpath
      // that normalizePackagePath keeps is more precise than the specifier
      // the file happens to import from.
      const typeReference =
        'import("/repo/node_modules/@scope/pkg/dist/types").SomeType';
      const fileName = '/repo/src/dto/test.dto.ts';

      const result = replaceImportPath(typeReference, fileName, {}, '@scope/pkg');

      expect(result.importPath).toBe('@scope/pkg/dist/types');
    });

    it('should produce relative path when import path contains URL-encoded non-ASCII characters', () => {
      // Simulates what TypeScript produces when the project path contains non-ASCII chars.
      // TypeScript may URL-encode the path in the type reference string.
      const typeReference =
        'import("/mnt/Data/testn%C3%A9stcli/testcli/src/entities/test.entity").TestEnum';
      const fileName =
        '/mnt/Data/testnéstcli/testcli/src/dto/test.dto.ts';
      const options = {};

      const result = replaceImportPath(typeReference, fileName, options);

      // The path should be relative, not absolute
      expect(result.typeReference).not.toContain('/mnt/Data');
      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should produce relative path when both import and file contain non-ASCII characters without encoding', () => {
      const typeReference =
        'import("/mnt/Data/testnéstcli/testcli/src/entities/test.entity").TestEnum';
      const fileName =
        '/mnt/Data/testnéstcli/testcli/src/dto/test.dto.ts';
      const options = {};

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).not.toContain('/mnt/Data');
      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should produce relative path when file name contains URL-encoded non-ASCII characters', () => {
      const typeReference =
        'import("/mnt/Data/testnéstcli/testcli/src/entities/test.entity").TestEnum';
      const fileName =
        '/mnt/Data/testn%C3%A9stcli/testcli/src/dto/test.dto.ts';
      const options = {};

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).not.toContain('/mnt/Data');
      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should handle paths without non-ASCII characters normally', () => {
      const typeReference =
        'import("/mnt/Data/testcli/src/entities/test.entity").TestEnum';
      const fileName = '/mnt/Data/testcli/src/dto/test.dto.ts';
      const options = {};

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).not.toContain('/mnt/Data');
      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should adjust relative path depth when outDir is deeper than rootDir (issue #2706)', () => {
      // Monorepo layout:
      //   rootDir : /project/apps/nest          (the app root, NOT src/)
      //   outDir  : /project/apps/nest/dist
      //   source  : /project/apps/nest/src/app.controller.ts
      //   output  : /project/apps/nest/dist/src/app.controller.js  ← src/ is preserved
      //   target  : /project/packages/math-helpers/dist/index
      //
      // Without correction `from` = src/, producing  ../../../packages/…  (3 levels)
      // With correction    `from` = dist/src/, producing ../../../../packages/… (4 levels)
      const typeReference =
        'import("/project/packages/math-helpers/dist/index").MathHelper';
      const fileName = '/project/apps/nest/src/app.controller.ts';
      const options = {
        rootDir: '/project/apps/nest',
        outDir: '/project/apps/nest/dist'
      };

      const result = replaceImportPath(typeReference, fileName, options);

      // Output file is at /project/apps/nest/dist/src/app.controller.js
      // Correct relative path: ../../../../packages/math-helpers/dist/index
      expect(result.typeReference).toContain(
        '../../../../packages/math-helpers/dist/index'
      );
    });

    it('should produce same path as baseline when outDir equals rootDir', () => {
      // When outDir and rootDir are at the same depth, the correction is a no-op.
      const typeReference =
        'import("/project/src/entities/test.entity").TestEnum';
      const fileName = '/project/src/dto/test.dto.ts';
      const options = {
        rootDir: '/project/src',
        outDir: '/project/src'
      };

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should remap import paths within rootDir to outDir (rootDir = src/)', () => {
      // Standard layout with rootDir pointing to src/:
      //   rootDir : /project/src
      //   outDir  : /project/dist
      //   source  : /project/src/dto/nested/test.dto.ts
      //   output  : /project/dist/dto/nested/test.dto.js
      //   import  : /project/src/entities/test.entity     (within rootDir)
      //   target  : /project/dist/entities/test.entity     (remapped to outDir)
      //
      // Without fix: require("../../../src/entities/test.entity")  (broken)
      // With fix:    require("../../entities/test.entity")          (correct)
      const typeReference =
        'import("/project/src/entities/test.entity").TestEnum';
      const fileName = '/project/src/dto/nested/test.dto.ts';
      const options = {
        rootDir: '/project/src',
        outDir: '/project/dist'
      };

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).toContain('../../entities/test.entity');
      expect(result.typeReference).not.toContain('/src/');
    });

    it('should adjust relative path depth in readonly mode when outDir is deeper than rootDir', () => {
      // Readonly (SWC/metadata.ts generation) mode must rebase pathToSource
      // through outDir/rootDir the same way normal mode rebases the source
      // file's directory, since the generated metadata.ts effectively lives
      // at the output location, not the source location.
      const typeReference =
        'import("/project/src/entities/test.entity").TestEnum';
      const fileName = '/project/src/dto/nested/test.dto.ts';
      const readonlyOptions = {
        readonly: true,
        pathToSource: '/project/src/dto/nested',
        rootDir: '/project/src',
        outDir: '/project/dist'
      };
      const nonReadonlyOptions = {
        rootDir: '/project/src',
        outDir: '/project/dist'
      };

      const readonlyResult = replaceImportPath(
        typeReference,
        fileName,
        readonlyOptions
      );
      const nonReadonlyResult = replaceImportPath(
        typeReference,
        fileName,
        nonReadonlyOptions
      );

      expect(readonlyResult.importPath).not.toContain('/dist/');
      expect(readonlyResult.importPath).toBe(nonReadonlyResult.importPath);
    });

    it('should fall back to source-based path when outDir/rootDir are absent', () => {
      // Baseline behaviour must be preserved when options do not include outDir/rootDir.
      const typeReference =
        'import("/project/src/entities/test.entity").TestEnum';
      const fileName = '/project/src/dto/test.dto.ts';
      const options = {};

      const result = replaceImportPath(typeReference, fileName, options);

      expect(result.typeReference).toContain('../entities/test.entity');
    });

    it('should keep bare package specifiers untouched instead of relativizing them', () => {
      // Resolvable bare specifiers must not be rewritten into a relative path.
      const typeReference = 'import("typescript").Program';
      const fileName = '/project/src/dto/test.dto.ts';

      const result = replaceImportPath(typeReference, fileName, {
        esmCompatible: true
      });

      // Inline ESM mode hands back the parts needed to hoist a static import.
      expect(result.importPath).toBe('typescript');
      expect(result.typeName).toBe('Program');
      expect(result.typeReference).toBe('(await import("typescript")).Program');
      expect(result.typeReference).not.toContain('..');
    });

    it('should keep bare package specifiers untouched in readonly ESM mode', () => {
      const typeReference = 'import("typescript").Program';
      const fileName = '/project/src/dto/test.dto.ts';

      const result = replaceImportPath(typeReference, fileName, {
        esmCompatible: true,
        readonly: true,
        pathToSource: '/project/src'
      });

      expect(result.importPath).toBeNull();
      expect(result.typeReference).toBe('import("typescript").Program');
    });

    it('should resolve bare package specifiers in the emitted ESM build', () => {
      // The test runner transforms modules and supplies a `require` shim, so
      // the bare-specifier branch must be exercised in a real Node process
      // against the built output, where CommonJS `require` is not in scope.
      const builtEntry = new URL(
        '../../dist/plugin/utils/plugin-utils.js',
        import.meta.url
      );
      if (!existsSync(fileURLToPath(builtEntry))) {
        return;
      }

      const output = execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `const m = await import(${JSON.stringify(builtEntry.href)});
           const r = m.replaceImportPath(
             'import("typescript").Program',
             '/project/src/dto/test.dto.ts',
             { esmCompatible: true }
           );
           console.log(JSON.stringify(r));`
        ],
        { encoding: 'utf8' }
      );

      expect(JSON.parse(output)).toEqual({
        typeReference: '(await import("typescript")).Program',
        typeName: 'Program',
        importPath: 'typescript'
      });
    });
  });
});

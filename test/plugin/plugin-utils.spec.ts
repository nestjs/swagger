import {
  convertPath,
  replaceImportPath,
  safeDecodeURIComponent
} from '../../lib/plugin/utils/plugin-utils';

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
  });
});

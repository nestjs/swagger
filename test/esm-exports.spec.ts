import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Package ESM exports', () => {
  let packageJson: any;

  beforeAll(() => {
    const packageJsonPath = resolve(__dirname, '..', 'package.json');
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  });

  it('should have an exports field', () => {
    expect(packageJson.exports).toBeDefined();
  });

  it('should define "." entry point with types and default', () => {
    const mainExport = packageJson.exports['.'];
    expect(mainExport).toBeDefined();
    expect(mainExport.types).toBe('./dist/index.d.ts');
    expect(mainExport.default).toBe('./dist/index.js');
  });

  it('should define "./plugin" subpath export', () => {
    const pluginExport = packageJson.exports['./plugin'];
    expect(pluginExport).toBeDefined();
    expect(pluginExport.types).toBe('./dist/plugin/index.d.ts');
    expect(pluginExport.default).toBe('./dist/plugin/index.js');
  });

  it('should expose package.json via exports', () => {
    expect(packageJson.exports['./package.json']).toBe('./package.json');
  });

  it('should have main field pointing to dist/index.js', () => {
    expect(packageJson.main).toBe('dist/index.js');
  });

  it('should have types field pointing to dist/index.d.ts', () => {
    expect(packageJson.types).toBe('dist/index.d.ts');
  });
});

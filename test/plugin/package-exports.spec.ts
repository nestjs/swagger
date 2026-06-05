import { readFileSync } from 'node:fs';

describe('package exports', () => {
  it('should expose a require-compatible CLI plugin entry', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    );

    expect(packageJson.exports['./plugin'].require).toBe(
      './dist/plugin/index.js'
    );
  });
});

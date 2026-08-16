import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';

const packageJsonUrl = new URL('../../package.json', import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonUrl, 'utf8'));
const requireFromRoot = createRequire(packageJsonUrl);

describe('package exports', () => {
  it('should expose a require-compatible CLI plugin entry', () => {
    expect(packageJson.exports['./plugin'].require).toBe(
      './dist/plugin/index.js'
    );
  });

  it('should declare a Node version that supports require() of ESM', () => {
    // The package is ESM-only, so CommonJS consumers (e.g. the Nest CLI) rely
    // on `require(esm)`. That is enabled by default from 20.19 on the 20.x
    // line and only from 22.12 on the 22.x line, so 22.0-22.11 must be
    // excluded rather than swept in by a plain ">=" range.
    // A plain ">=20.19.0" would wrongly sweep in 22.0-22.11.
    expect(packageJson.engines.node).toBe('^20.19.0 || >=22.12.0');
  });

  for (const [subpath, conditions] of Object.entries<Record<string, string>>(
    packageJson.exports
  )) {
    if (typeof conditions === 'string') {
      continue;
    }

    it(`should resolve every export condition of "${subpath}" to an emitted file`, () => {
      for (const target of new Set(Object.values(conditions))) {
        const absolutePath = fileURLToPath(new URL(target, packageJsonUrl));
        expect(existsSync(absolutePath), `${target} was not emitted`).toBe(true);
      }
    });
  }

  it('should allow CommonJS consumers to require the CLI plugin entry', () => {
    const pluginEntry = requireFromRoot(packageJson.exports['./plugin'].require);

    expect(typeof pluginEntry.before).toBe('function');
    // ts-patch/ttypescript invoke the default export as the transformer.
    expect(typeof (pluginEntry.default ?? pluginEntry)).toBe('function');
  });

  it('should allow CommonJS consumers to require the root entry', () => {
    // A CommonJS Nest application still does `require('@nestjs/swagger')`.
    const rootEntry = requireFromRoot(packageJson.exports['.'].require);

    expect(typeof rootEntry.ApiProperty).toBe('function');
    expect(typeof rootEntry.SwaggerModule).toBe('function');
    expect(typeof rootEntry.DocumentBuilder).toBe('function');
  });

  it('should expose a ts-patch compatible default transformer', () => {
    const pluginEntry = requireFromRoot(packageJson.exports['./plugin'].require);
    const program = ts.createProgram([], {});

    // ts-patch calls the default export as `default(program, options)`, which
    // is the reverse of the `before(options, program)` argument order.
    const transformerFactory = pluginEntry.default(program, {});

    expect(typeof transformerFactory).toBe('function');
  });

  it('should be loadable through the ESM import condition', async () => {
    const imported = await import(
      new URL(packageJson.exports['.'].import, packageJsonUrl).href
    );

    expect(typeof imported.SwaggerModule).toBe('function');
  });
});

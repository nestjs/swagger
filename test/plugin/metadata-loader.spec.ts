import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as ts from 'typescript';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';

describe('MetadataLoader', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'swagger-metadata-loader-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should apply metadata of a default exported class and skip a class missing from the module', async () => {
    const file = join(dir, 'cats.controller.ts');
    writeFileSync(
      file,
      `export default class CatsController {
  findAll(): Promise<string[]> { return null as any; }
}
class HiddenController {
  findAll(): Promise<number[]> { return null as any; }
}
`
    );
    const program = ts.createProgram([file], {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      strict: true
    });
    const visitor = new ReadonlyVisitor({ pathToSource: dir });
    visitor.visit(program, program.getSourceFile(file)!);
    const { controllers } = visitor.collect() as any;
    const [, fileMeta] = controllers[0];

    class CatsController {}
    await new MetadataLoader().load({
      '@nestjs/swagger': {
        controllers: [[Promise.resolve({ default: CatsController }), fileMeta]]
      }
    });

    expect((CatsController as any)._OPENAPI_METADATA_FACTORY()).toEqual(
      fileMeta.CatsController
    );
  });
});

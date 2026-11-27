import { join } from 'path';
import { MetadataLoader } from '../../lib/plugin/metadata-loader';
import { METADATA_FACTORY_NAME } from '../../lib/plugin/plugin-constants';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';

// Fixture layout:
//   src/member.dto.ts   exports one class with the `export` modifier, and the
//                       others through `export { ... }` (one of them under
//                       another name) and `export default`, next to a class
//                       that is not exported at all
const projectDir = join(__dirname, 'fixtures', 'readonly-export-list');

function collectModelKeys() {
  const program = ReadonlyVisitor.createTsProgram(
    join(projectDir, 'tsconfig.json')
  );
  const visitor = new ReadonlyVisitor({
    pathToSource: join(projectDir, 'src'),
    dtoFileNameSuffix: ['.dto.ts']
  });
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      visitor.visit(program, sourceFile);
    }
  }
  const [[, metadata]] = visitor.collect().models;
  return Object.keys(metadata);
}

describe('ReadonlyVisitor with classes exported by an export statement', () => {
  it('should collect the metadata of every exported class', () => {
    expect(collectModelKeys()).toEqual(
      expect.arrayContaining([
        'BillingDto',
        'ListedDto',
        'PublicDto',
        'DefaultDto'
      ])
    );
  });

  it('should leave out a class that is not exported', () => {
    expect(collectModelKeys()).not.toContain('InternalDto');
    expect(collectModelKeys()).not.toContain('RenamedDto');
  });

  it('should key the metadata by the names the loader looks the classes up by', async () => {
    class ListedDto {}
    class RenamedDto {}
    class DefaultDto {}
    const moduleExports = {
      ListedDto,
      PublicDto: RenamedDto,
      default: DefaultDto
    };
    const keys = collectModelKeys();

    await new MetadataLoader().load({
      '@nestjs/swagger': {
        models: [
          [
            Promise.resolve(moduleExports),
            Object.fromEntries(keys.map((key) => [key, {}]))
          ]
        ]
      }
    });

    expect(ListedDto[METADATA_FACTORY_NAME]).toBeDefined();
    expect(RenamedDto[METADATA_FACTORY_NAME]).toBeDefined();
    expect(DefaultDto[METADATA_FACTORY_NAME]).toBeDefined();
  });
});

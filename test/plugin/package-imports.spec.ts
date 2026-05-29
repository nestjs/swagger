import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import { getImportedTypeReference } from '../../lib/plugin/utils/plugin-utils';

function createFixtureProgram() {
  const projectRoot = join(__dirname, 'fixtures', 'package-imports');
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    join(projectRoot, 'tsconfig.json'),
    undefined,
    ts.sys as unknown as ts.ParseConfigFileHost
  );
  const program = ts.createProgram({
    options: parsedCmd!.options,
    rootNames: parsedCmd!.fileNames,
    projectReferences: parsedCmd!.projectReferences
  });
  const sourceFile = program.getSourceFile(
    join(projectRoot, 'apps', 'api', 'src', 'item.dto.ts')
  )!;

  return { program, sourceFile };
}

function getFixtureProperty(name: string) {
  const { program, sourceFile } = createFixtureProgram();
  const classDeclaration = sourceFile.statements.find(
    (statement): statement is ts.ClassDeclaration =>
      ts.isClassDeclaration(statement) && statement.name?.text === 'ItemDto'
  )!;
  const property = (
    classDeclaration.members as ts.NodeArray<ts.PropertyDeclaration>
  ).find((member) => member.name.getText(sourceFile) === name)!;

  return {
    checker: program.getTypeChecker(),
    property
  };
}

describe('package imports', () => {
  describe('getImportedTypeReference', () => {
    it('should preserve package import specifiers for named, aliased, array, nullable, and namespace references', () => {
      const { checker, property: status } = getFixtureProperty('status');
      const { property: aliasedStatus } = getFixtureProperty('aliasedStatus');
      const { property: statusList } = getFixtureProperty('statusList');
      const { property: nullableStatus } = getFixtureProperty('nullableStatus');
      const { property: namespacedStatus } =
        getFixtureProperty('namespacedStatus');

      expect(getImportedTypeReference(status.type, checker)).toBe(
        'import("@repro/shared/messages").ItemStatus'
      );
      expect(getImportedTypeReference(aliasedStatus.type, checker)).toBe(
        'import("@repro/shared/messages").ItemStatus'
      );
      expect(getImportedTypeReference(statusList.type, checker)).toBe(
        'import("@repro/shared/messages").ItemStatus'
      );
      expect(getImportedTypeReference(nullableStatus.type, checker)).toBe(
        'import("@repro/shared/messages").ItemStatus'
      );
      expect(getImportedTypeReference(namespacedStatus.type, checker)).toBe(
        'import("@repro/shared/messages").ItemStatus'
      );
    });

    it('should ignore bare package imports and local types', () => {
      const { checker, property: uuid } = getFixtureProperty('uuid');
      const { property: localStatus } = getFixtureProperty('localStatus');

      expect(getImportedTypeReference(uuid.type, checker)).toBeUndefined();
      expect(
        getImportedTypeReference(localStatus.type, checker)
      ).toBeUndefined();
    });
  });

  it('should preserve package import paths in generated metadata', () => {
    const { program, sourceFile } = createFixtureProgram();
    let outputText = '';

    const emitResult = program.emit(
      sourceFile,
      (_fileName, text) => {
        outputText = text;
      },
      undefined,
      false,
      {
        before: [before({}, program)]
      }
    );

    expect(emitResult.emitSkipped).toBe(false);
    expect(outputText).toContain(
      `status: { required: true, enum: require("@repro/shared/messages").ItemStatus }`
    );
    expect(outputText).toContain(
      `aliasedStatus: { required: true, enum: require("@repro/shared/messages").ItemStatus }`
    );
    expect(outputText).toContain(
      `statusList: { required: true, enum: require("@repro/shared/messages").ItemStatus, isArray: true }`
    );
    expect(outputText).toContain(
      `nullableStatus: { required: true, nullable: true, enum: require("@repro/shared/messages").ItemStatus }`
    );
    expect(outputText).toContain(
      `namespacedStatus: { required: true, enum: require("@repro/shared/messages").ItemStatus }`
    );
    expect(outputText).toContain(
      `uuid: { required: true, type: () => Object }`
    );
    expect(outputText).not.toContain('packages/shared/dist/messages');
    expect(outputText).not.toContain(`require("crypto").UUID`);
  });
});

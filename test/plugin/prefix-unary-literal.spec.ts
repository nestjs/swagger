import { join } from 'path';
import * as ts from 'typescript';
import { before } from '../../lib/plugin/compiler-plugin';
import { ModelClassVisitor } from '../../lib/plugin/visitors/model-class.visitor';
import { ReadonlyVisitor } from '../../lib/plugin/visitors/readonly.visitor';
import { PluginMetadataPrinter } from './helpers/metadata-printer';

const rangeDtoText = `
import { ArrayMinSize, IsDivisibleBy, Max, Min } from 'class-validator';
import { BASE, FLAG, LIMIT, MASK } from './constants';

const MIN = 5;

export class RangeDto {
  @Min(-LIMIT)
  @Max(+LIMIT)
  value: number = -MIN;
  separator: number = -1_000;
  hex: number = -0x10;
  safe: number = -Number.MAX_SAFE_INTEGER;
  negative: number = -1.5;
  positive: number = +5;
  enabled: boolean = !FLAG;
  mask: number = ~MASK;
  base: number = +BASE;
  @ArrayMinSize(-LIMIT)
  items: string[];
  @IsDivisibleBy(-2)
  even: number;

  constructor(
    public ctorDefault: number = -MIN,
    public ctorFlag: boolean = !FLAG
  ) {}
}
`;

function transpileRangeDto(module: ts.ModuleKind, parameterProperties = false) {
  const options: ts.CompilerOptions = {
    module,
    target: ts.ScriptTarget.ES2020,
    newLine: ts.NewLineKind.LineFeed,
    noEmitHelpers: true,
    experimentalDecorators: true,
    strict: true
  };
  const filename = 'range.dto.ts';
  const fakeProgram = ts.createProgram([filename], options);

  return ts.transpileModule(rangeDtoText, {
    compilerOptions: options,
    fileName: filename,
    transformers: {
      before: [
        before({ classValidatorShim: true, parameterProperties }, fakeProgram)
      ]
    }
  }).outputText;
}

function getMetadataFactoryBody(output: string) {
  return output.match(/_OPENAPI_METADATA_FACTORY\(\) \{\n\s*(return .*)\n/)![1];
}

describe('Prefix unary expressions in model properties', () => {
  it('should keep prefix unary defaults and validator arguments (CommonJS)', () => {
    const factoryBody = getMetadataFactoryBody(
      transpileRangeDto(ts.ModuleKind.CommonJS)
    );

    expect(factoryBody).toContain(
      `value: { required: true, type: () => Number, default: -MIN, minimum: -constants_1.LIMIT, maximum: +constants_1.LIMIT }`
    );
    expect(factoryBody).toContain(
      `separator: { required: true, type: () => Number, default: -1000 }`
    );
    expect(factoryBody).toContain(
      `hex: { required: true, type: () => Number, default: -16 }`
    );
    expect(factoryBody).toContain(
      `safe: { required: true, type: () => Number, default: -Number.MAX_SAFE_INTEGER }`
    );
    expect(factoryBody).toContain(
      `negative: { required: true, type: () => Number, default: -1.5 }`
    );
    expect(factoryBody).toContain(
      `positive: { required: true, type: () => Number, default: +5 }`
    );
    expect(factoryBody).toContain(
      `enabled: { required: true, type: () => Boolean, default: !constants_1.FLAG }`
    );
    expect(factoryBody).toContain(
      `mask: { required: true, type: () => Number, default: ~constants_1.MASK }`
    );
    expect(factoryBody).toContain(
      `base: { required: true, type: () => Number, default: +constants_1.BASE }`
    );
    expect(factoryBody).toContain(
      `items: { required: true, type: () => [String], minItems: -constants_1.LIMIT }`
    );
    expect(factoryBody).toContain(
      `even: { required: true, type: () => Number, multipleOf: -2 }`
    );
  });

  it('should keep prefix unary defaults and validator arguments (ESM)', () => {
    const factoryBody = getMetadataFactoryBody(
      transpileRangeDto(ts.ModuleKind.ES2020)
    );

    expect(factoryBody).toContain(
      `value: { required: true, type: () => Number, default: -MIN, minimum: -LIMIT, maximum: +LIMIT }`
    );
    expect(factoryBody).toContain(
      `enabled: { required: true, type: () => Boolean, default: !FLAG }`
    );
    expect(factoryBody).toContain(
      `items: { required: true, type: () => [String], minItems: -LIMIT }`
    );
  });

  it('should keep prefix unary defaults of constructor parameter properties', () => {
    const factoryBody = getMetadataFactoryBody(
      transpileRangeDto(ts.ModuleKind.CommonJS, true)
    );

    expect(factoryBody).toContain(
      `ctorDefault: { required: true, type: () => Number, default: -MIN }`
    );
    expect(factoryBody).toContain(
      `ctorFlag: { required: true, type: () => Boolean, default: !constants_1.FLAG }`
    );
  });

  it('should produce a metadata factory that evaluates with imported identifiers (CommonJS)', () => {
    const output = transpileRangeDto(ts.ModuleKind.CommonJS);
    const decoratorFactory = () => () => undefined;
    const modules: Record<string, unknown> = {
      '@nestjs/swagger': {},
      'class-validator': {
        ArrayMinSize: decoratorFactory,
        IsDivisibleBy: decoratorFactory,
        Max: decoratorFactory,
        Min: decoratorFactory
      },
      './constants': { BASE: 2, FLAG: true, LIMIT: 10, MASK: 3 }
    };
    const exports: Record<string, any> = {};
    new Function('exports', 'require', '__decorate', output)(
      exports,
      (id: string) => modules[id],
      () => undefined
    );

    const metadata = exports.RangeDto._OPENAPI_METADATA_FACTORY();
    expect(metadata.value).toMatchObject({
      default: -5,
      minimum: -10,
      maximum: 10
    });
    expect(metadata.separator.default).toBe(-1000);
    expect(metadata.hex.default).toBe(-16);
    expect(metadata.safe.default).toBe(-Number.MAX_SAFE_INTEGER);
    expect(metadata.enabled.default).toBe(false);
    expect(metadata.mask.default).toBe(-4);
    expect(metadata.base.default).toBe(2);
    expect(metadata.items.minItems).toBe(-10);
  });

  it.each([
    [
      '-1',
      () =>
        ts.factory.createPrefixUnaryExpression(
          ts.SyntaxKind.MinusToken,
          ts.factory.createNumericLiteral('1')
        )
    ],
    ['false', () => ts.factory.createFalse()]
  ])(
    'should clone a synthetic %s initializer',
    (expected, createInitializer) => {
      const property = ts.factory.createPropertyDeclaration(
        undefined,
        'value',
        undefined,
        undefined,
        createInitializer()
      );
      const assignment =
        new ModelClassVisitor().createDefaultPropertyAssignment(
          ts.factory,
          property,
          ts.factory.createNodeArray(),
          {}
        );
      const source = ts.createSourceFile('', '', ts.ScriptTarget.Latest);

      expect(
        ts
          .createPrinter()
          .printNode(ts.EmitHint.Unspecified, assignment!, source)
      ).toBe(`default: ${expected}`);
    }
  );

  describe('in readonly mode', () => {
    const projectDir = join(__dirname, 'fixtures', 'readonly-prefix-unary');

    function printReadonlyMetadata(parameterProperties: boolean) {
      const program = ReadonlyVisitor.createTsProgram(
        join(projectDir, 'tsconfig.json')
      );
      const visitor = new ReadonlyVisitor({
        pathToSource: join(projectDir, 'src'),
        dtoFileNameSuffix: ['.dto.ts'],
        classValidatorShim: true,
        parameterProperties
      });

      for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
          visitor.visit(program, sourceFile);
        }
      }

      return new PluginMetadataPrinter().print(
        { [visitor.key]: visitor.collect() },
        visitor.typeImports
      );
    }

    it('should only serialize self-contained prefix unary values', () => {
      const output = printReadonlyMetadata(false);

      expect(output).toContain(
        `value: { required: true, type: () => Number, maximum: -1 }`
      );
      expect(output).toContain(
        `negative: { required: true, type: () => Number, default: -5 }`
      );
      expect(output).toContain(
        `positive: { required: true, type: () => Number, default: +5 }`
      );
      expect(output).toContain(
        `enabled: { required: true, type: () => Boolean }`
      );
      expect(output).toContain(
        `items: { required: true, type: () => [String] }`
      );
      expect(output).not.toMatch(/MIN|FLAG|LIMIT/);
    });

    it('should only serialize self-contained prefix unary values of constructor parameter properties', () => {
      const output = printReadonlyMetadata(true);

      expect(output).toContain(
        `ctorDefault: { required: true, type: () => Number }`
      );
      expect(output).toContain(
        `ctorNegative: { required: true, type: () => Number, default: -2 }`
      );
      expect(output).not.toMatch(/MIN|FLAG|LIMIT/);
    });
  });
});

import * as prettier from 'prettier';
import * as ts from 'typescript';

export class PluginMetadataPrinter {
  print(
    metadata: Record<string, Record<string, Array<[ts.CallExpression, any]>>>,
    typeImports: Record<string, string>
  ) {
    const objectLiteralExpr = ts.factory.createObjectLiteralExpression(
      Object.keys(metadata).map((key) =>
        this.recursivelyCreatePropertyAssignment(
          key,
          metadata[key] as unknown as Array<[ts.CallExpression, any]>
        )
      )
    );
    const exportAssignment = ts.factory.createExportAssignment(
      undefined,
      undefined,
      ts.factory.createArrowFunction(
        [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock(
          [
            ts.factory.createVariableStatement(
              undefined,
              ts.factory.createVariableDeclarationList(
                [
                  ts.factory.createVariableDeclaration(
                    ts.factory.createIdentifier('t'),
                    undefined,
                    undefined,
                    ts.factory.createObjectLiteralExpression(
                      Object.keys(typeImports).map((ti) =>
                        this.createPropertyAssignment(ti, typeImports[ti])
                      ),
                      true
                    )
                  )
                ],
                ts.NodeFlags.Const |
                  ts.NodeFlags.AwaitContext |
                  ts.NodeFlags.ContextFlags |
                  ts.NodeFlags.TypeExcludesFlags
              )
            ),
            ts.factory.createReturnStatement(objectLiteralExpr)
          ],
          true
        )
      )
    );

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });
    const resultFile = ts.createSourceFile(
      'file.ts',
      '',
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS
    );
    const output = printer.printNode(
      ts.EmitHint.Unspecified,
      exportAssignment,
      resultFile
    );
    return (
      `// @ts-nocheck\n` +
      prettier.format(output, {
        parser: 'typescript',
        singleQuote: true,
        trailingComma: 'none'
      })
    );
  }

  private createPropertyAssignment(identifier: string, target: string) {
    return ts.factory.createPropertyAssignment(
      ts.factory.createComputedPropertyName(
        ts.factory.createStringLiteral(identifier)
      ),
      ts.factory.createIdentifier(target)
    );
  }

  private recursivelyCreatePropertyAssignment(
    identifier: string,
    meta: any | Array<[ts.CallExpression, any]>
  ): ts.PropertyAssignment {
    if (Array.isArray(meta)) {
      return ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral(identifier),
        ts.factory.createArrayLiteralExpression(
          meta.map(([importExpr, meta]) =>
            ts.factory.createArrayLiteralExpression([
              importExpr,
              ts.factory.createObjectLiteralExpression(
                Object.keys(meta).map((key) =>
                  this.recursivelyCreatePropertyAssignment(key, meta[key])
                )
              )
            ])
          )
        )
      );
    }
    return ts.factory.createPropertyAssignment(
      ts.factory.createStringLiteral(identifier),
      ts.isObjectLiteralExpression(meta as unknown as ts.Node)
        ? (meta as ts.ObjectLiteralExpression)
        : ts.factory.createObjectLiteralExpression(
            Object.keys(meta).map((key) =>
              this.recursivelyCreatePropertyAssignment(key, meta[key])
            )
          )
    );
  }
}

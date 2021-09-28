import * as Shim from '../../lib/extra/swagger-shim';
import * as Actual from '../../lib';

describe('Shim file', () => {
  it('contains all types export by package', () => {
    const exceptions = ['getSchemaPath', 'refs'];

    const shimExportNames = Object.keys(Shim);
    const packageExportNames = Object.keys(Actual);

    const exportsMissingInShim = packageExportNames.filter(
      (exportName) =>
        shimExportNames.indexOf(exportName) === -1 &&
        exceptions.indexOf(exportName) === -1
    );

    expect(exportsMissingInShim).toEqual([]);
  });
});

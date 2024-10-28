import { mergePluginOptions } from '../../lib/plugin/merge-options';
import {
  createCliPluginMultiOption,
  createCliPluginSingleOption,
  mergedCliPluginMultiOption,
  mergedCliPluginSingleOption
} from './fixtures/create-option';

describe('CLI Plugin options', () => {
  it('should skip element when dtoFileNameSuffix key has more than one element and include ".ts"', () => {
    const merged = mergePluginOptions(createCliPluginMultiOption);
    expect(JSON.stringify(merged)).toEqual(
      JSON.stringify(mergedCliPluginMultiOption)
    );
  });

  it('should delete key when dtoFileNameSuffix key has 1 element and element is “.ts”', () => {
    const merged = mergePluginOptions(createCliPluginSingleOption);
    expect(JSON.stringify(merged)).toEqual(
      JSON.stringify(mergedCliPluginSingleOption)
    );
  });
});

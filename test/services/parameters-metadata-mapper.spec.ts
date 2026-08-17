import { ModelPropertiesAccessor } from '../../lib/services/model-properties-accessor';
import { ParametersMetadataMapper } from '../../lib/services/parameters-metadata-mapper';

describe('ParametersMetadataMapper', () => {
  let mapper: ParametersMetadataMapper;

  beforeEach(() => {
    mapper = new ParametersMetadataMapper(new ModelPropertiesAccessor());
  });

  it('should skip nullish parameter entries', () => {
    // Custom param decorators (or third-party libraries writing directly into
    // the route args metadata) can leave nullish entries behind.
    const properties = mapper.transformModelToProperties({
      ':0': undefined,
      ':1': null,
      ':2': { in: 'query', name: 'limit', type: Number }
    } as any);

    expect(properties).toEqual([{ in: 'query', name: 'limit', type: Number }]);
  });

  it('should keep parameters carrying a standard schema untouched', () => {
    const standardSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: unknown) => ({ value })
      }
    };
    const properties = mapper.transformModelToProperties({
      ':0': { in: 'body', standardSchema }
    } as any);

    expect(properties).toEqual([{ in: 'body', standardSchema }]);
  });

  it('should drop parameters without a usable type', () => {
    const properties = mapper.transformModelToProperties({
      ':0': { in: 'query', name: 'unknown' },
      ':1': { in: 'query', name: 'loose', type: Object }
    } as any);

    expect(properties).toEqual([]);
  });
});

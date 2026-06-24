import { MimetypeContentWrapper } from '../../lib/services/mimetype-content-wrapper';

describe('MimetypeContentWrapper', () => {
  let wrapper: MimetypeContentWrapper;

  beforeEach(() => {
    wrapper = new MimetypeContentWrapper();
  });

  it('should wrap the object under each provided mimetype', () => {
    const { content } = wrapper.wrap(
      ['application/json', 'application/xml'],
      {
        schema: { type: 'string' }
      }
    );

    expect(content).toEqual({
      'application/json': { schema: { type: 'string' } },
      'application/xml': { schema: { type: 'string' } }
    });
  });

  it('should strip undefined keys from the wrapped object', () => {
    const { content } = wrapper.wrap(['application/json'], {
      schema: { type: 'string' },
      example: undefined
    });

    expect(content['application/json']).toEqual({
      schema: { type: 'string' }
    });
    expect('example' in content['application/json']).toBe(false);
  });

  it('should not share the same object reference between mimetypes', () => {
    const { content } = wrapper.wrap(
      ['application/json', 'application/xml'],
      {
        schema: { type: 'string' }
      }
    );

    expect(content['application/json']).not.toBe(content['application/xml']);
    expect(content['application/json'].schema).not.toBe(
      content['application/xml'].schema
    );

    // Mutating one mimetype entry must not affect the others.
    (content['application/json'].schema as Record<string, any>).type =
      'mutated';

    expect(content['application/xml'].schema).toEqual({ type: 'string' });
  });

  it('should not mutate the source object passed in by the caller', () => {
    const source = { schema: { type: 'string' } };
    const { content } = wrapper.wrap(['application/json'], source);

    (content['application/json'].schema as Record<string, any>).type =
      'mutated';

    expect(source.schema.type).toBe('string');
  });
});

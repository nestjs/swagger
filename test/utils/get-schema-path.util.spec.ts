import 'reflect-metadata';
import { ApiSchema } from '../../lib/decorators/api-schema.decorator';
import { getSchemaPath, refs } from '../../lib/utils/get-schema-path.util';

describe('getSchemaPath', () => {
  @ApiSchema({ name: 'Feline' })
  class Cat {}

  class Dog {}

  it('uses the name set with @ApiSchema()', () => {
    expect(getSchemaPath(Cat)).toBe('#/components/schemas/Feline');
    expect(getSchemaPath(Dog)).toBe('#/components/schemas/Dog');
  });

  describe('refs', () => {
    it('uses the name set with @ApiSchema()', () => {
      expect(refs(Cat, Dog)).toEqual([
        { $ref: '#/components/schemas/Feline' },
        { $ref: '#/components/schemas/Dog' }
      ]);
    });
  });
});

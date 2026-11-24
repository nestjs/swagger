import 'reflect-metadata';
import { ApiSchema } from '../../lib/decorators/api-schema.decorator';
import { getSchemaPath, refs } from '../../lib/utils/get-schema-path.util';

describe('getSchemaPath', () => {
  @ApiSchema({ name: 'Feline' })
  class Cat {}

  class Dog {}

  @ApiSchema()
  class Bird {}

  it('uses the name set with @ApiSchema()', () => {
    expect(getSchemaPath(Cat)).toBe('#/components/schemas/Feline');
    expect(getSchemaPath(Dog)).toBe('#/components/schemas/Dog');
  });

  it('falls back to the class name for @ApiSchema() without options', () => {
    expect(getSchemaPath(Bird)).toBe('#/components/schemas/Bird');
  });

  describe('refs', () => {
    it('uses the name set with @ApiSchema()', () => {
      expect(refs(Cat, Dog)).toEqual([
        { $ref: '#/components/schemas/Feline' },
        { $ref: '#/components/schemas/Dog' }
      ]);
    });

    it('falls back to the class name for @ApiSchema() without options', () => {
      expect(refs(Bird)).toEqual([{ $ref: '#/components/schemas/Bird' }]);
    });
  });
});

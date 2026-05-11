import { ApiProperty, ApiPropertyOptional } from '../../lib/decorators';
import { generateSchema } from '../../lib/utils/generate-schema.util';

describe('generateSchema', () => {
  class AddressDto {
    @ApiProperty({ type: 'string' })
    street: string;

    @ApiProperty({ type: 'string' })
    city: string;
  }

  class UserDto {
    @ApiProperty({ type: 'string' })
    name: string;

    @ApiProperty({ type: 'number' })
    age: number;

    @ApiPropertyOptional({ type: () => AddressDto })
    address?: AddressDto;
  }

  it('returns a schema object for a simple DTO', () => {
    const { schema } = generateSchema(AddressDto);
    expect(schema).toBeDefined();
    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('street');
    expect(schema.properties).toHaveProperty('city');
  });

  it('populates schemas with the target class entry', () => {
    const { schemas } = generateSchema(AddressDto);
    expect(schemas['AddressDto']).toBeDefined();
  });

  it('populates schemas with nested class schemas', () => {
    const { schemas } = generateSchema(UserDto);
    expect(schemas['UserDto']).toBeDefined();
    expect(schemas['AddressDto']).toBeDefined();
  });

  it('returns the correct schema reference for the target class', () => {
    const { schema, schemas } = generateSchema(UserDto);
    expect(schema).toBe(schemas['UserDto']);
  });

  it('preserves extra schemas passed in', () => {
    const existing: Record<string, any> = {
      ExistingSchema: { type: 'object', properties: {} }
    };
    const { schemas } = generateSchema(AddressDto, existing);
    expect(schemas['ExistingSchema']).toBeDefined();
    expect(schemas['AddressDto']).toBeDefined();
  });

  it('can be used to compose oneOf schemas inline', () => {
    const { schema: addressSchema } = generateSchema(AddressDto);
    const composedSchema = {
      oneOf: [addressSchema, { type: 'boolean', enum: [false] }]
    };
    expect(composedSchema.oneOf).toHaveLength(2);
    expect(composedSchema.oneOf[0]).toBe(addressSchema);
  });
});

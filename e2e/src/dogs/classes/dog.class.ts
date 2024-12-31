import { ApiExtension, ApiProperty } from '../../../../lib';

@ApiExtension('x-schema-extension', { test: 'test' })
@ApiExtension('x-schema-extension-multiple', { test: 'test' })
export class Dog {
  @ApiProperty({ example: 'Chonk', description: 'The name of the Dog' })
  name: string;

  @ApiProperty({ example: 1, minimum: 0, description: 'The age of the Dog' })
  age: number;

  @ApiProperty({
    example: 'Pitt bull',
    description: 'The breed of the Dog'
  })
  breed: string;

  @ApiProperty({
    name: '_tags',
    type: [String]
  })
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: String,
    isArray: true
  })
  urls?: string[];
}

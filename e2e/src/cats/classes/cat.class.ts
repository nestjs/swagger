import { ApiProperty } from '../../../../lib';
import { LettersEnum } from '../dto/pagination-query.dto';

export class Cat {
  @ApiProperty({ example: 'Kitty', description: 'The name of the Cat' })
  name: string;

  @ApiProperty({ example: 1, minimum: 0, description: 'The age of the Cat' })
  age: number;

  @ApiProperty({
    example: 'Maine Coon',
    description: 'The breed of the Cat'
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

  @ApiProperty({
    name: '_options',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        isReadonly: {
          type: 'string'
        }
      }
    }
  })
  options?: Record<string, any>[];

  @ApiProperty({
    enum: LettersEnum
  })
  enum: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    isArray: true
  })
  enumArr: LettersEnum;

  @ApiProperty({ type: [String], link: () => Cat })
  kittenIds?: string[];
}

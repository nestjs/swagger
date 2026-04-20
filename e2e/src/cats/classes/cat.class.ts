import {
  ApiExtension,
  ApiExtraModels,
  ApiProperty,
  getSchemaPath
} from '../../../../lib';
import { LettersEnum } from '../dto/pagination-query.dto';
import { TagDto } from '../dto/tag.dto';

@ApiExtraModels(TagDto)
@ApiExtension('x-schema-extension', { test: 'test' })
@ApiExtension('x-schema-extension-multiple', { test: 'test*2' })
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
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'ErrorName'
      },
      status: {
        type: 'number',
        example: 400
      }
    },
    required: ['name', 'status'],
    selfRequired: true
  })
  rawDefinition: Record<string, any>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    selfRequired: false
  })
  optionalRawDefinition?: Record<string, boolean>;

  @ApiProperty({
    enum: LettersEnum
  })
  enum: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    isArray: true
  })
  enumArr: LettersEnum[];

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    description: 'A small assortment of letters?',
    default: 'A',
    deprecated: true
  })
  enumWithRef: LettersEnum;

  @ApiProperty({
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'array', items: { type: 'number' } },
      { type: 'array', items: { type: 'boolean' } }
    ],
    description: 'Array of values that uses "oneOf"'
  })
  oneOfExample?: string[] | number[] | boolean[];

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    oneOf: [
      { type: 'string' },
      { type: 'number' }
    ],
    description: 'Enum named reference combined with oneOf combinators'
  })
  enumNamedWithOneOf?: LettersEnum | string | number;

  @ApiProperty({ type: [String], link: () => Cat })
  kittenIds?: string[];

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(TagDto) },
      { type: 'array', items: { $ref: getSchemaPath(TagDto) } }
    ]
  })
  oneOfWithRef?: any; // Simulates union type Example | Example[] (issue #3549)
}

import {
  ApiExtension,
  ApiExtraModels,
  ApiProperty
} from '../../../../lib/index.js';
import { XEnumTest } from '../enums/x-enum-test.enum.js';
import { ExtraModelDto } from './extra-model.dto.js';
import { LettersEnum } from './pagination-query.dto.js';
import { TagDto } from './tag.dto.js';

@ApiExtraModels(ExtraModelDto)
@ApiExtension('x-tags', ['foo', 'bar'])
export class CreateCatDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty({ minimum: 1, maximum: 200 })
  readonly age: number;

  @ApiProperty({ name: '_breed', type: String })
  readonly breed: string;

  @ApiProperty({
    format: 'uri',
    type: [String]
  })
  readonly tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: 'string',
    isArray: true
  })
  readonly urls?: string[];

  @ApiProperty({
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
  readonly options?: Record<string, any>[];

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
    description: 'Enum with description'
  })
  readonly enumWithDescription: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum'
  })
  readonly enum: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    isArray: true,
    description: 'This is a description for the enumArr attribute'
  })
  readonly enumArr: LettersEnum[];

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    description: 'A small assortment of letters (in DTO)?',
    default: 'A',
    deprecated: true,
    enumSchema: {
      description: 'This is a description for the LettersEnum schema',
      deprecated: true
    }
  })
  readonly enumWithRef: LettersEnum;

  @ApiProperty({ description: 'tag', required: false })
  readonly tag: TagDto;

  @ApiProperty({
    description: 'nullable tag',
    nullable: true,
    type: () => TagDto
  })
  readonly nullableTag: TagDto;

  nested: {
    first: string;
    second: number;
  };

  @ApiProperty({
    description: 'The x-enumNames test',
    enum: XEnumTest,
    enumName: 'XEnumTest',
    'x-enumNames': ['APPROVED', 'PENDING', 'REJECTED']
  })
  xEnumTest: XEnumTest;
}

import { ApiExtension, ApiExtraModels, ApiProperty } from '../../../../lib';
import { ExtraModel } from './extra-model.dto';
import { LettersEnum } from './pagination-query.dto';
import { TagDto } from './tag.dto';

@ApiExtraModels(ExtraModel)
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
    isArray: true
  })
  readonly enumArr: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    description: 'A small assortment of letters?',
    default: 'A',
    deprecated: true,
  })
  readonly enumWithRef: LettersEnum

  @ApiProperty({ description: 'tag', required: false })
  readonly tag: TagDto;

  nested: {
    first: string;
    second: number;
  };
}

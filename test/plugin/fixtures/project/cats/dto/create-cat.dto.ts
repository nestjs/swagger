import { ApiExtraModels, ApiProperty } from '../../../../lib';
import { ExtraModel } from './extra-model.dto';
import { LettersEnum } from './pagination-query.dto';
import { TagDto } from './tag.dto';

export enum CategoryState {
  OK = 'OK',
  DEPRECATED = 'DEPRECATED'
}

@ApiExtraModels(ExtraModel)
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
    enum: LettersEnum,
    enumName: 'LettersEnum'
  })
  readonly enum: LettersEnum;

  /**
   * Available language in the application
   * @example FR
   */
  state?: CategoryState;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    isArray: true
  })
  readonly enumArr: LettersEnum;

  readonly enumArr2: LettersEnum[];

  @ApiProperty({ description: 'tag', required: false })
  readonly tag: TagDto;

  readonly multipleTags: TagDto[];

  nested: {
    first: string;
    second: number;
  };
}

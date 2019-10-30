import { ApiExtraModels, ApiProperty } from '../../../../lib';
import { ExtraModel } from './extra-model.dto';
import { LettersEnum } from './pagination-query.dto';

@ApiExtraModels(ExtraModel)
export class CreateCatDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly age: number;

  @ApiProperty({ name: '_breed', type: String })
  readonly breed: string;

  @ApiProperty({
    type: [String]
  })
  readonly tags?: string[];

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
    enum: LettersEnum
  })
  enum: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    isArray: true
  })
  enumArr: LettersEnum;
}

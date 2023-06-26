import {
  IsIn,
  IsNegative,
  IsPositive,
  Length,
  Matches,
  Max,
  Min
} from 'class-validator';
import { randomUUID } from 'node:crypto';
import { ApiExtraModels, ApiProperty } from '../../../../lib';
import { ExtraModel } from './extra-model.dto';
import { LettersEnum } from './pagination-query.dto';
import { TagDto } from './tag.dto';

export enum CategoryState {
  OK = 'OK',
  DEPRECATED = 'DEPRECATED'
}

const MAX_AGE = 200;

@ApiExtraModels(ExtraModel)
export class CreateCatDto {
  @IsIn(['a', 'b'])
  isIn: string;

  @Matches(/^[+]?abc$/)
  pattern: string;

  @IsPositive()
  positive: number = 5;

  @IsNegative()
  negative: number = -1;

  @Length(2)
  lengthMin: string;

  @Length(3, 5)
  lengthMinMax: string;

  date = new Date();

  @ApiProperty()
  readonly name: string = randomUUID();

  @Min(1)
  @Max(MAX_AGE)
  @ApiProperty({ minimum: 1, maximum: 200 })
  readonly age: number = 14;

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

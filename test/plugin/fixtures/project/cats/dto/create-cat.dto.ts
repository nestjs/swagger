import { ConsoleLogger } from '@nestjs/common';
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

enum NonExportedEnum {
  YES = 'YES',
  NO = 'NO'
}

class NonExportedClass {
  prop: string;
}

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
  lengthMin: string | null = null;

  @Length(3, 5)
  lengthMinMax: string;

  date = new Date();

  active: boolean = false;

  @ApiProperty()
  name: string = randomUUID();

  @Min(1)
  @Max(MAX_AGE)
  @ApiProperty({ minimum: 1, maximum: 200 })
  age: number = 14;

  @ApiProperty({ name: '_breed', type: String })
  breed: string = 'Persian';

  @ApiProperty({
    format: 'uri',
    type: [String]
  })
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: 'string',
    isArray: true
  })
  urls?: string[];

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
  options?: Record<string, any>[];

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum'
  })
  enum: LettersEnum;

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
  enumArr: LettersEnum;

  enumArr2: LettersEnum[];

  @ApiProperty({ description: 'tag', required: false })
  tag: TagDto;

  multipleTags: TagDto[];

  nested: {
    first: string;
    second: number;
  };

  // Both props should be ignored
  nonExportedEnum: NonExportedEnum;
  nonExportedClass: NonExportedClass;

  // Default value should be ignored
  logger = new ConsoleLogger();
}

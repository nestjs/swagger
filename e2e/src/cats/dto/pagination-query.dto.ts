import { ApiProperty } from '../../../../lib';

export enum LettersEnum {
  A = 'A',
  B = 'B',
  C = 'C'
}

export class PaginationQuery {
  @ApiProperty({
    minimum: 0,
    maximum: 10000,
    title: 'Page',
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    format: 'int32',
    default: 0
  })
  page: number;

  @ApiProperty({
    name: '_sortBy',
    type: [String]
  })
  sortBy: string[];

  @ApiProperty()
  limit: number;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum'
  })
  enum: LettersEnum;

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'LettersEnum',
    isArray: true
  })
  enumArr: LettersEnum;
}

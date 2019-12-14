import { ApiProperty } from '../../../../lib';

export enum LettersEnum {
  A = 'A',
  B = 'B',
  C = 'C'
}

export class PaginationQuery {
  @ApiProperty()
  page: number;

  @ApiProperty({
    name: '_sortBy',
    type: [String]
  })
  sortBy: string[];

  @ApiProperty()
  limit: number;

  @ApiProperty({
    enum: () => LettersEnum
  })
  enum: LettersEnum;

  @ApiProperty({
    enum: () => LettersEnum,
    isArray: true
  })
  enumArr: LettersEnum;
}

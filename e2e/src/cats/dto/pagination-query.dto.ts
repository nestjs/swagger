import { ApiProperty } from '../../../../lib';

export enum LettersEnum {
  A = 'A',
  B = 'B',
  C = 'C'
}

export class PaginationQuery {
  @ApiProperty({
    exclusiveMinimum: 0,
    exclusiveMaximum: 10000,
    title: 'Page',
    format: 'int32',
    default: 0
  })
  page: number;

  @ApiProperty({
    name: '_sortBy'
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

  @ApiProperty()
  beforeDate: Date;

  @ApiProperty({
    type: 'object',
    additionalProperties: true
  })
  filter: Record<string, any>;

  static _OPENAPI_METADATA_FACTORY() {
    return {
      sortBy: { type: () => [String] }
    };
  }
}

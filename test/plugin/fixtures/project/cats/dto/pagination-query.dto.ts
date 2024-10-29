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
    default: 0,
    example: 123
  })
  page: number;

  @ApiProperty({
    name: '_sortBy',
    nullable: true,
    example: ['sort1', 'sort2']
  })
  sortBy: string[];

  @ApiProperty()
  limit: number;

  @ApiProperty({
    oneOf: [
      {
        minimum: 0,
        maximum: 10,
        format: 'int32'
      },
      {
        minimum: 100,
        maximum: 100,
        format: 'int32'
      }
    ],
  })
  constrainedLimit?: number;

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
  enumArr: LettersEnum[];

  @ApiProperty({
    enum: LettersEnum,
    enumName: 'Letter',
    isArray: true,
  })
  letters: LettersEnum[];

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

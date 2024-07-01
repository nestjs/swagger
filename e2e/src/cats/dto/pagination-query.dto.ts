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
    nullable: true
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
    properties: {
      name: {
        type: 'string'
      },
      age: {
        type: 'number',
      }
    },
    additionalProperties: true
  })
  filter: Record<string, any>;

  static _OPENAPI_METADATA_FACTORY() {
    return {
      sortBy: { type: () => [String] }
    };
  }
}

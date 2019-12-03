import { ApiProperty } from '../../../../lib';

export class ExtraModel {
  @ApiProperty()
  readonly one: string;

  @ApiProperty()
  readonly two: number;
}

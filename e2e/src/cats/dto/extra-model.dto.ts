import { ApiProperty, ApiSchema } from '../../../../lib';

@ApiSchema({
  name: 'ExtraModel'
})
export class ExtraModelDto {
  @ApiProperty()
  readonly one: string;

  @ApiProperty()
  readonly two: number;
}

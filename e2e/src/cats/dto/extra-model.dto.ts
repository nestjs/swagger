import { ApiProperty, ApiSchema } from '../../../../lib';

@ApiSchema({
  name: 'ExtraModel',
  description: 'ExtraModel description'
})
export class ExtraModelDto {
  @ApiProperty()
  readonly one: string;

  @ApiProperty()
  readonly two: number;
}

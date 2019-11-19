import { ApiProperty } from '../../../../lib';

export class TagDto {
  @ApiProperty({ description: 'name' })
  name: string;
}

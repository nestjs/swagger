import { ApiProperty } from '../../../../lib/index.js';

export class TagDto {
  @ApiProperty({ description: 'name' })
  name: string;
}

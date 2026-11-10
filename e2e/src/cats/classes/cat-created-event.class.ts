import { ApiProperty } from '../../../../lib/index.js';

export class CatCreatedEvent {
  @ApiProperty({ description: 'The name of the created Cat' })
  name: string;
}

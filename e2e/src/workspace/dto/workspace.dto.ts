import { ApiProperty } from '../../../../lib';

export class WorkspaceDto {
  @ApiProperty({ example: 'my-workspace' })
  name: string;

  @ApiProperty({ example: 'acme-corp', required: false })
  slug?: string;

  @ApiProperty({ example: 10, required: false })
  memberCount?: number;
}

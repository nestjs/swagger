import { ApiProperty } from '../../../../lib';

export class ValidationErrorDto {
  @ApiProperty({
    type: 'number',
    description: 'HTTP status code'
  })
  status: number;

  @ApiProperty({
    type: 'string',
    description: 'Error description'
  })
  description: string;
}

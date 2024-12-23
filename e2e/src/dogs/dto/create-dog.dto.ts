import { ApiExtension, ApiProperty } from '../../../../lib';

@ApiExtension('x-tags', ['foo', 'bar'])
export class CreateDogDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty({ minimum: 1, maximum: 200 })
  readonly age: number;

  @ApiProperty({ name: '_breed', type: String })
  readonly breed: string;

  @ApiProperty({
    format: 'uri',
    type: [String]
  })
  readonly tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: 'string',
    isArray: true
  })
  readonly urls?: string[];
}

import 'reflect-metadata';
import { ApiProperty, ApiPropertyOptional } from '../../../lib/decorators';
import { CreateProfileDto } from './create-profile.dto';

export class CreateUserDto {
  @ApiProperty()
  login: string;

  @ApiProperty({
    examples: ['test', 'test2']
  })
  password: string;

  @ApiPropertyOptional({
    format: 'int64',
    example: 10
  })
  age?: number;

  @ApiProperty({
    required: false,
    readOnly: true,
    type: 'array',
    maxItems: 10,
    minItems: 1,
    items: {
      type: 'array',
      items: {
        type: 'number'
      }
    }
  })
  custom: any;

  @ApiProperty({
    type: () => CreateProfileDto
  })
  profile: CreateProfileDto;

  @ApiProperty({
    type: [String]
  })
  tags: string[];

  @ApiProperty({
    type: String,
    isArray: true
  })
  urls: string[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        isReadonly: {
          type: 'string'
        }
      }
    }
  })
  options?: Record<string, any>[];

  @ApiProperty({
    oneOf: [
      { $ref: '#/components/schemas/Cat' },
      { $ref: '#/components/schemas/Dog' }
    ],
    discriminator: { propertyName: 'pet_type' }
  })
  allOf?: Record<string, any>;
}

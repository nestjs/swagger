import 'reflect-metadata';
import { ApiProperty, ApiPropertyOptional } from '../../../lib/decorators';
import { CreateProfileDto } from './create-profile.dto';

class House {}

export class CreateUserDto {
  @ApiProperty()
  login: string;

  @ApiProperty({
    example: 'password123'
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
    description: 'Profile',
    nullable: true,
    type: () => CreateProfileDto
  })
  profile: CreateProfileDto;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  twoDimensionPrimitives: string[][];

  @ApiProperty({
    type: () => [[CreateProfileDto]]
  })
  twoDimensionModels: CreateProfileDto[][];

  @ApiProperty({
    type: String,
    isArray: true,
    format: 'uri'
  })
  urls: string[];

  @ApiProperty({
    type: 'integer',
    isArray: true
  })
  luckyNumbers: number[];

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

  @ApiProperty({ type: [House] })
  houses: House[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  amount: bigint;

  @ApiProperty({ type: [String], format: 'uuid' })
  formatArray: string[];

  static _OPENAPI_METADATA_FACTORY() {
    return {
      tags: { type: () => [String] },
      twoDimensionPrimitives: { type: () => [[String]] }
    };
  }
}

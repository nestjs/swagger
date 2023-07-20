import { Expose, Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { ApiProperty } from '../../../lib/decorators';
import { METADATA_FACTORY_NAME } from '../../../lib/plugin/plugin-constants';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @ApiProperty({ required: true })
  login: string;

  @Expose()
  @Transform((str) => str + '_transformed')
  @IsString()
  @ApiProperty({ minLength: 10 })
  password: string;

  static [METADATA_FACTORY_NAME]() {
    return {
      firstName: { required: true, type: String },
      lastName: { required: true, type: String }
    };
  }
}

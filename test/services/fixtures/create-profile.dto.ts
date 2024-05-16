import 'reflect-metadata';
import { ApiProperty } from '../../../lib/decorators';
import { CreateUserDto } from './create-user.dto';

export class CreateProfileDto {
  @ApiProperty()
  firstname: string;

  @ApiProperty()
  lastname: string;

  @ApiProperty({
    type: () => CreateUserDto,
    name: 'parent'
  })
  parent: CreateUserDto;
}

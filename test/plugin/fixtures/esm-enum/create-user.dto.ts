import { Role } from './role.enum.js';

export class CreateUserDto {
  name: string;
  role: Role;
}

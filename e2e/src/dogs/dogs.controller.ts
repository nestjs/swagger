import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '../../../lib';

@ApiTags('dogs')
@Controller('dogs')
export class DogsController {
  @Get()
  findAll() {
    return 'Dogs';
  }

  @Get('puppies')
  findPuppies() {
    return 'Puppies';
  }
}

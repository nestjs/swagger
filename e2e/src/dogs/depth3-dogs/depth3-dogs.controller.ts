import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '../../../../lib';

@ApiTags('depth3-dogs')
@Controller('depth3-dogs')
export class Depth3DogsController {
  @Get()
  findAll() {
    return 'Depth3 Dogs';
  }
}

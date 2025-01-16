import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '../../../../lib';

@ApiTags('depth2-dogs')
@Controller('depth2-dogs')
export class Depth2DogsController {
  @Get()
  findAll() {
    return 'Depth2 Dogs';
  }
}

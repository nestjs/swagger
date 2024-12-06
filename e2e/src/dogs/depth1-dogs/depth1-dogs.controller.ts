import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '../../../../lib';

@ApiTags('depth1-dogs')
@Controller('depth1-dogs')
export class Depth1DogsController {
  @Get()
  findAll() {
    return 'Depth1 Dogs';
  }
}

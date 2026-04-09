import { Controller, Get } from '@nestjs/common';

@Controller('baz')
export class BazController {
  @Get()
  getBaz() {
    return 'baz';
  }
}

import { Controller, Get } from '@nestjs/common';

@Controller('bar')
export class BarController {
  @Get()
  getBar() {
    return 'bar';
  }
}

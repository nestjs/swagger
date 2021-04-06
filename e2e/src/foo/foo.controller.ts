import { Controller, Get } from '@nestjs/common';

@Controller('foo')
export class FooController {
  @Get()
  getFoo() {
    return 'foo';
  }
}

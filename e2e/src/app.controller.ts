import { Controller, Get } from '@nestjs/common';

@Controller({
  version: ['1', '2']
})
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello world!';
  }

  @Get(['alias1', 'alias2'])
  withAliases(): string {
    return 'Hello world!';
  }
}

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

  @Get('express[:]colon[:]another/:prop')
  withColonExpress(): string {
    return 'Hello world!';
  }

  @Get('fastify::colon::another/:prop')
  withColonFastify(): string {
    return 'Hello world!';
  }
}

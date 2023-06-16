import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Says hello
   * @deprecated
   */
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

import { Controller, Get } from '@nestjs/common';

@Controller({
  version: ['1', '2']
})
export class FastifyController {
  @Get('fastify::colon::another/:prop')
  withColons(): string {
    return 'Hello world!';
  }

  @Get('/example/:file(^\\d+).png')
  withRegexp(): string {
    return 'Hello world!';
  }
}

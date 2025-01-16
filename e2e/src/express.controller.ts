import { Controller, Get } from '@nestjs/common';

@Controller({
  version: ['1', '2']
})
export class ExpressController {
  @Get('express\\:colon\\:another/:prop')
  withColons(): string {
    return 'Hello world!';
  }
}

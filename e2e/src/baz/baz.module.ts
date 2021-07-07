import { Module } from '@nestjs/common';
import { BazController } from './baz.controller';

@Module({
  controllers: [BazController]
})
export class BazModule {}

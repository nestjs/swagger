import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';

@Module({
  controllers: [BarController]
})
export class BarModule {}

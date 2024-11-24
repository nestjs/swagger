import { Module } from '@nestjs/common';
import { Depth3DogsController } from './depth3-dogs.controller';

@Module({
  controllers: [Depth3DogsController]
})
export class Depth3DogsModule {}

import { Module } from '@nestjs/common';
import { Depth2DogsController } from './depth2-dogs.controller';
import { Depth3DogsModule } from '../depth3-dogs/depth3-dogs.module';

@Module({
  imports: [Depth3DogsModule],
  controllers: [Depth2DogsController]
})
export class Depth2DogsModule {}

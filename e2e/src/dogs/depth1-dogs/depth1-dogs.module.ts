import { Module } from '@nestjs/common';
import { Depth1DogsController } from './depth1-dogs.controller';
import { Depth2DogsModule } from '../depth2-dogs/depth2-dogs.module';

@Module({
  imports: [Depth2DogsModule],
  controllers: [Depth1DogsController]
})
export class Depth1DogsModule {}

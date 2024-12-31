import { Module } from '@nestjs/common';
import { DogsController } from './dogs.controller';
import { Depth1DogsModule } from './depth1-dogs/depth1-dogs.module';

@Module({
  imports: [Depth1DogsModule],
  controllers: [DogsController]
})
export class DogsModule {}

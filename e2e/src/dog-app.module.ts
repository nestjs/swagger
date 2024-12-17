import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DogsModule } from './dogs/dogs.module';

@Module({
  imports: [DogsModule],
  controllers: [AppController]
})
export class ApplicationModule {}

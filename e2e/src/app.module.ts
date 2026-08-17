import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
  controllers: [AppController]
})
export class ApplicationModule {}

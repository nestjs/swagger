import { Module } from '@nestjs/common';
import { BarModule } from './bar/bar.module';
import { BazModule } from './baz/baz.module';
import { FooModule } from './foo/foo.module';

@Module({
  imports: [FooModule, BarModule, BazModule]
})
export class IncludeExcludeModule {}

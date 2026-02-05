import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';

@Module({
  controllers: [WorkspaceController]
})
export class WorkspaceModule {}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '../../../lib';
import { WorkspaceDto } from './dto/workspace.dto';

@ApiTags('workspace')
@Controller('workspace')
export class WorkspaceController {
  @Post('body')
  createWithBody(@Body() dto: WorkspaceDto) {
    return { received: dto };
  }

  @Get('query')
  searchWithQuery(@Query() dto: WorkspaceDto) {
    return { received: dto };
  }
}
